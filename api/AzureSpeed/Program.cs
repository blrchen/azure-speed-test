using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using AzureSpeed.WebApp;
using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;

const string IpLookupBaseUrl = "https://azureiplookup-westus3.azurewebsites.net/api";
var builder = WebApplication.CreateBuilder(args);
ConfigureServices(builder);
var app = builder.Build();
ConfigureApp(app);
app.Run();

void ConfigureServices(WebApplicationBuilder builder)
{
    builder.Services.AddApplicationInsightsTelemetry(_ =>
    {
        _.EnableAdaptiveSampling = false;
        _.EnableRequestTrackingTelemetryModule = false;
    });
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", _ => { _.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod(); });
    });
    builder.Services.AddHttpClient();
    builder.Services.AddSingleton(_ => new StorageAccountSelector(LoadStorageRegions(builder.Environment)));
}

IReadOnlyDictionary<string, IReadOnlyList<StorageAccount>> LoadStorageRegions(IWebHostEnvironment environment)
{
    string settingsFilePath = Path.Combine(environment.ContentRootPath, "Data", "settings.json");
    string settingsContent = File.ReadAllText(settingsFilePath);
    var settings = JsonSerializer.Deserialize<Settings>(settingsContent)
        ?? throw new InvalidOperationException($"Unable to load storage settings from {settingsFilePath}.");
    if (settings.Regions.Count == 0)
    {
        throw new InvalidOperationException($"Storage settings from {settingsFilePath} do not contain any regions.");
    }

    var regions = new Dictionary<string, IReadOnlyList<StorageAccount>>(StringComparer.OrdinalIgnoreCase);
    foreach (var (regionName, accounts) in settings.Regions.OrderBy(region => region.Key, StringComparer.Ordinal))
    {
        if (accounts.Count == 0)
        {
            throw new InvalidOperationException($"Storage region {regionName} does not contain any accounts.");
        }

        var duplicatePrefixes = accounts
            .GroupBy(account => account.Prefix, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToArray();
        if (duplicatePrefixes.Length > 0)
        {
            throw new InvalidOperationException(
                $"Storage region {regionName} contains duplicate account prefixes: {string.Join(", ", duplicatePrefixes)}.");
        }

        var invalidTrafficWeightAccounts = accounts
            .Where(account => account.TrafficWeight < 0)
            .Select(account => account.Name)
            .ToArray();
        if (invalidTrafficWeightAccounts.Length > 0)
        {
            throw new InvalidOperationException(
                $"Storage region {regionName} contains accounts with negative trafficWeight: {string.Join(", ", invalidTrafficWeightAccounts)}.");
        }

        if (accounts.Sum(account => (long)account.TrafficWeight) <= 0)
        {
            throw new InvalidOperationException(
                $"Storage region {regionName} does not contain any accounts with positive trafficWeight.");
        }

        regions[regionName] = accounts.ToArray();
    }

    return regions;
}

void ConfigureApp(WebApplication app)
{
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }

    app.UseCors("AllowAll");
    MapApiEndpoints(app);
}

void MapApiEndpoints(WebApplication app)
{
    var api = app.MapGroup("/api");

    api.MapGet("/ipAddress", GetAzureIpsAddress);
    api.MapGet("/sas", GetSasUrl);
}

async Task<IResult> GetAzureIpsAddress(
    string? ipOrDomain,
    IHttpClientFactory httpClientFactory,
    ILoggerFactory loggerFactory,
    CancellationToken requestAborted)
{
    if (string.IsNullOrWhiteSpace(ipOrDomain))
    {
        return Results.BadRequest(new { message = "Query string ipOrDomain is required." });
    }

    var logger = loggerFactory.CreateLogger("AzureSpeed.Api");
    logger.LogInformation("GetAzureIpAddress {IPOrDomain}", ipOrDomain);

    var httpClient = httpClientFactory.CreateClient();
    string url = $"{IpLookupBaseUrl}/ipAddress?ipOrDomain={Uri.EscapeDataString(ipOrDomain)}";
    using var timeout = CancellationTokenSource.CreateLinkedTokenSource(requestAborted);
    timeout.CancelAfter(TimeSpan.FromSeconds(10));

    try
    {
        using var response = await httpClient.GetAsync(url, timeout.Token);
        string result = await response.Content.ReadAsStringAsync(timeout.Token);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "GetAzureIpAddress upstream returned {StatusCode} for {IPOrDomain}",
                (int)response.StatusCode,
                ipOrDomain);
            return Results.Json(
                new
                {
                    message = "Azure IP lookup service returned an error.",
                    upstreamStatusCode = (int)response.StatusCode
                },
                statusCode: GetIpLookupErrorStatusCode(response.StatusCode));
        }

        return Results.Content(result, "application/json");
    }
    catch (OperationCanceledException) when (!requestAborted.IsCancellationRequested)
    {
        logger.LogWarning("GetAzureIpAddress upstream timed out for {IPOrDomain}", ipOrDomain);
        return Results.Json(
            new { message = "Azure IP lookup service timed out." },
            statusCode: StatusCodes.Status504GatewayTimeout);
    }
    catch (HttpRequestException ex)
    {
        logger.LogWarning(ex, "GetAzureIpAddress upstream request failed for {IPOrDomain}", ipOrDomain);
        return Results.Json(
            new { message = "Azure IP lookup service is unavailable." },
            statusCode: StatusCodes.Status502BadGateway);
    }
}

int GetIpLookupErrorStatusCode(HttpStatusCode upstreamStatusCode)
{
    int statusCode = (int)upstreamStatusCode;
    return statusCode >= StatusCodes.Status500InternalServerError
        ? StatusCodes.Status502BadGateway
        : statusCode;
}

IResult GetSasUrl(
    string? regionName,
    string? blobName,
    string? operation,
    StorageAccountSelector storageAccountSelector,
    ILoggerFactory loggerFactory)
{
    if (string.IsNullOrWhiteSpace(regionName) ||
        string.IsNullOrWhiteSpace(blobName) ||
        string.IsNullOrWhiteSpace(operation))
    {
        return Results.BadRequest(new { message = "Query strings regionName, blobName, and operation are required." });
    }

    var logger = loggerFactory.CreateLogger("AzureSpeed.Api");
    logger.LogInformation(
        "GetSasUrl {Region} {BlobName} {Operation}",
        regionName,
        blobName,
        operation);

    if (!AzureStorageClient.IsSupportedOperation(operation))
    {
        return Results.BadRequest(new { message = $"Operation {operation} is not supported." });
    }
    if (!storageAccountSelector.TryGetNext(
            regionName,
            operation,
            out var storageAccount,
            out int poolSize,
            out int weightUnits) ||
        storageAccount is null)
    {
        return Results.BadRequest(new { message = $"Region {regionName} is not supported." });
    }

    logger.LogInformation(
        "GetSasUrl selected {StorageAccount} ({StoragePrefix}, traffic weight {TrafficWeight}) for {Region} {Operation}; pool size {PoolSize}; weight units {WeightUnits}",
        storageAccount.Name,
        storageAccount.Prefix,
        storageAccount.TrafficWeight,
        regionName,
        operation,
        poolSize,
        weightUnits);

    var azureStorageClient = new AzureStorageClient(storageAccount);
    string url = azureStorageClient.GetSasUrl(blobName, operation).ToString();
    return Results.Ok(new { url });
}


public class AzureStorageClient
{
    private readonly string connectionString;

    public static bool IsSupportedOperation(string operation)
    {
        return operation.Equals("upload", StringComparison.OrdinalIgnoreCase) ||
            operation.Equals("download", StringComparison.OrdinalIgnoreCase);
    }

    public AzureStorageClient(StorageAccount account)
    {
        connectionString = $"DefaultEndpointsProtocol=https;AccountName={account.Name};AccountKey={account.Key}";
    }

    public Uri GetSasUrl(string blobName, string operation)
    {
        string containerName = string.Empty;
        BlobSasPermissions blobSasPermissions;
        switch (operation.ToUpperInvariant())
        {
            case "UPLOAD":
                blobSasPermissions = BlobSasPermissions.Write | BlobSasPermissions.Create;
                containerName = "upload";
                break;
            case "DOWNLOAD":
                blobSasPermissions = BlobSasPermissions.Read;
                containerName = "private";
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(operation), operation, "Unsupported storage operation.");
        }

        var blobContainerClient = new BlobContainerClient(connectionString, containerName);
        var blobClient = blobContainerClient.GetBlobClient(blobName);

        BlobSasBuilder sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = containerName,
            BlobName = blobName,
            Resource = "b",
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-15),
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(5)
        };
        sasBuilder.SetPermissions(blobSasPermissions);

        return blobClient.GenerateSasUri(sasBuilder);
    }
}

public sealed class StorageAccountSelector
{
    private const int MaxWeightUnits = 10_000;
    private readonly IReadOnlyDictionary<string, StorageAccountPool> storageAccountPoolsByRegion;
    private readonly ConcurrentDictionary<string, long> counters = new(StringComparer.OrdinalIgnoreCase);

    public StorageAccountSelector(IReadOnlyDictionary<string, IReadOnlyList<StorageAccount>> storageAccountsByRegion)
    {
        storageAccountPoolsByRegion = storageAccountsByRegion.ToDictionary(
            pair => pair.Key,
            pair => new StorageAccountPool(pair.Value),
            StringComparer.OrdinalIgnoreCase);
    }

    public bool TryGetNext(
        string regionName,
        string operation,
        out StorageAccount? storageAccount,
        out int poolSize,
        out int weightUnits)
    {
        storageAccount = null;
        poolSize = 0;
        weightUnits = 0;
        if (!storageAccountPoolsByRegion.TryGetValue(regionName, out var pool) || pool.WeightedAccounts.Count == 0)
        {
            return false;
        }

        poolSize = pool.Accounts.Count;
        weightUnits = pool.WeightedAccounts.Count;
        string counterKey = $"{regionName}:{operation.ToUpperInvariant()}";
        long next = counters.AddOrUpdate(counterKey, 0, (_, current) => current == long.MaxValue ? 0 : current + 1);
        storageAccount = pool.WeightedAccounts[(int)(next % pool.WeightedAccounts.Count)];
        return true;
    }

    private sealed class StorageAccountPool
    {
        public StorageAccountPool(IReadOnlyList<StorageAccount> accounts)
        {
            Accounts = accounts;
            WeightedAccounts = BuildWeightedAccounts(accounts);
        }

        public IReadOnlyList<StorageAccount> Accounts { get; }

        public IReadOnlyList<StorageAccount> WeightedAccounts { get; }
    }

    private sealed class WeightedAccount
    {
        public WeightedAccount(StorageAccount account)
        {
            Account = account;
        }

        public StorageAccount Account { get; }

        public long CurrentWeight { get; set; }
    }

    private static IReadOnlyList<StorageAccount> BuildWeightedAccounts(IReadOnlyList<StorageAccount> accounts)
    {
        var weightedAccounts = accounts
            .Where(account => account.TrafficWeight > 0)
            .Select(account => new WeightedAccount(account))
            .ToArray();
        long totalWeight = weightedAccounts.Sum(account => (long)account.Account.TrafficWeight);
        if (totalWeight <= 0)
        {
            return [];
        }
        if (totalWeight > MaxWeightUnits)
        {
            throw new InvalidOperationException($"Storage account trafficWeight total is too large: {totalWeight}.");
        }

        var sequence = new List<StorageAccount>((int)totalWeight);
        for (int i = 0; i < totalWeight; i++)
        {
            WeightedAccount? selected = null;
            foreach (var account in weightedAccounts)
            {
                account.CurrentWeight += account.Account.TrafficWeight;
                if (selected is null || account.CurrentWeight > selected.CurrentWeight)
                {
                    selected = account;
                }
            }

            if (selected is null)
            {
                throw new InvalidOperationException("Unable to build weighted storage account pool.");
            }

            selected.CurrentWeight -= totalWeight;
            sequence.Add(selected.Account);
        }

        return sequence;
    }
}
