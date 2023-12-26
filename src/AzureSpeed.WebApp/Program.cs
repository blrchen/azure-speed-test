using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Rewrite;
using Newtonsoft.Json;
using System.Text;
using AzureSpeed.WebApp;

var builder = WebApplication.CreateBuilder(args);
ConfigureServices(builder);
var app = builder.Build();
ConfigureApp(app);
app.Run();

static void ConfigureServices(WebApplicationBuilder builder)
{
    builder.Services.AddApplicationInsightsTelemetry();
    builder.Services.AddControllersWithViews();
    builder.Services.AddHttpClient();
    builder.Services.AddTransient<IChatGptClient, ChatGptClient>();
    builder.Services.AddSingleton<IDictionary<string, StorageAccount>>(LoadAccountsDictionary(builder));
}

static IDictionary<string, StorageAccount> LoadAccountsDictionary(WebApplicationBuilder builder)
{
    var settingsFilePath = Path.Combine(builder.Environment.ContentRootPath, "Data", "settings.json");
    var settingsContent = File.ReadAllText(settingsFilePath);
    var settings = JsonConvert.DeserializeObject<Settings>(settingsContent);
    return settings.Accounts.ToDictionary(account => account.LocationId);
}

static void ConfigureApp(WebApplication app)
{
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }
    var logger = app.Services.GetRequiredService<ILogger<UrlRedirectionRule>>();
    var urlRedirectionRule = new UrlRedirectionRule(logger);
    app.UseRewriter(new RewriteOptions().Add(urlRedirectionRule));
    app.UseHttpsRedirection();
    app.UseStaticFiles();
    app.UseRouting();
    app.MapControllerRoute(name: "default", pattern: "{controller}/{action=Index}/{id?}");
    app.MapFallbackToFile("index.html");
}

public class UrlRedirectionRule : IRule
{
    private static readonly Dictionary<string, string> RedirectionRules = new()
    {
        { "/Information/AzureBillingMeters", "/" },
        { "/Information/AzureVMPricing", "/" },
        { "/Information/AzureIpRange", "/Information/AzureIpRanges" },
        { "/Information/IpRange", "/Information/AzureIpRanges" },
        { "/Information/References", "/Azure/About" },
        { "/Cloud/RegionFinder", "/Azure/IPLookup" },
        { "/ChatGPT/AppList", "/ChatGPT/CodeAssistant" },
    };

    private readonly ILogger<UrlRedirectionRule> logger;

    public UrlRedirectionRule(ILogger<UrlRedirectionRule> logger)
    {
        this.logger = logger;
    }

    public void ApplyRule(RewriteContext context)
    {
        var request = context.HttpContext.Request;
        var originalPath = request.Path.Value;
        var originalHost = request.Host.Host;

        if (originalHost.Equals("azurespeed.com", StringComparison.OrdinalIgnoreCase))
        {
            var newHost = "www." + originalHost;
            Redirect(context, request.Scheme, newHost, originalPath, request.QueryString.ToUriComponent(), request.Host.Port);
            return;
        }

        if (RedirectionRules.TryGetValue(originalPath, out var redirectPath))
        {
            Redirect(context, request.Scheme, originalHost, redirectPath, request.QueryString.ToUriComponent(), request.Host.Port);
        }
    }

    private static void Redirect(RewriteContext context, string scheme, string host, string path, string queryString, int? port)
    {
        var newUrl = new UriBuilder
        {
            Scheme = scheme,
            Host = host,
            Path = path,
            Query = queryString,
            Port = port ?? (scheme == "https" ? 443 : 80)
        };

        context.HttpContext.Response.StatusCode = 301;
        context.HttpContext.Response.Redirect(newUrl.ToString(), true);
        context.Result = RuleResult.EndResponse;
    }
}

[Route("api")]
[ApiController]
public class ApiController : ControllerBase
{
    private readonly ILogger<ApiController> logger;
    private readonly IWebHostEnvironment webHostEnvironment;
    private readonly HttpClient httpClient;
    private readonly IChatGptClient chatGptClient;
    private readonly IDictionary<string, StorageAccount> storageAccounts;

    public ApiController(
        ILogger<ApiController> logger,
        IWebHostEnvironment webHostEnvironment,
        HttpClient httpClient,
        IChatGptClient chatGptClient,
        IDictionary<string, StorageAccount> storageAccounts)
    {
        this.logger = logger;
        this.webHostEnvironment = webHostEnvironment;
        this.httpClient = httpClient;
        this.chatGptClient = chatGptClient;
        this.storageAccounts = storageAccounts;
    }

    [HttpGet("ipAddress")]
    public async Task<IActionResult> GetAzureIpsAddress(string ipOrDomain)
    {
        if (string.IsNullOrWhiteSpace(ipOrDomain))
        {
            return BadRequest("Query string ipOrDomain can not be null");
        }

        string url = $"https://azure-ip-lookup.azurewebsites.net/api/ipAddress?ipOrDomain={ipOrDomain}";
        var result = await httpClient.GetStringAsync(url);

        return Ok(result);
    }

    [HttpGet("sas")]
    public IActionResult GetSasUrl(string regionName, string blobName, string operation)
    {
        if (string.IsNullOrWhiteSpace(regionName) || string.IsNullOrWhiteSpace(blobName) || string.IsNullOrWhiteSpace(operation))
        {
            return BadRequest("Query strings regionName, blobName, operation can not be null");
        }

        if (!storageAccounts.TryGetValue(regionName, out var storageAccount))
        {
            return BadRequest($"Region {regionName} is not supported");
        }

        var azureStorageClient = new AzureStorageClient(storageAccount);
        string url = azureStorageClient.GetSasUrl(blobName, operation).ToString();
        return Ok(new { Url = url });
    }

    [HttpPost("free-for-10-calls-per-ip-each-day")]
    public async Task<IActionResult> GetChatCompletion([FromBody] ChatCompletionRequest payload)
    {
        try
        {
            payload.SystemPrompt = SystemPrompts.GetPromptById(payload.SystemPromptId, webHostEnvironment.ContentRootPath);
            if (!string.IsNullOrWhiteSpace(payload.ResponseLanguage))
            {
                payload.SystemPrompt = payload.SystemPrompt.Replace("{ResponseLanguage}", payload.ResponseLanguage);
            }
            if (!string.IsNullOrWhiteSpace(payload.ProgramLanguage))
            {
                payload.SystemPrompt = payload.SystemPrompt.Replace("{ProgramLanguage}", payload.ProgramLanguage);
            }

            var response = await chatGptClient.GetChatCompletion(payload);
            return Ok(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while processing chat completion.");
            return StatusCode(500, new { message = "Server error. Please try again later. Refreshing with Ctrl+F5 may resolve the issue. If it continues, report the problem at https://github.com/blrchen/azure-speed-test/issues." });
        }
    }
}

public static class SystemPrompts
{
    public static string GetPromptById(string id, string contentRootPath)
    {
        var promptFilePath = Path.Combine(contentRootPath, "Prompts", $"{id}.txt");
        if (File.Exists(promptFilePath))
        {
            return File.ReadAllText(promptFilePath);
        }

        throw new ArgumentException($"No prompt with ID {id} found.", nameof(id));
    }
}

public interface IAzureStorageClient
{
    Uri GetSasUrl(string blobName, string operation);
}

public class AzureStorageClient : IAzureStorageClient
{
    private readonly string connectionString;

    public AzureStorageClient(StorageAccount account)
    {
        connectionString = $"DefaultEndpointsProtocol=https;AccountName={account.Name};AccountKey={account.Key}";
    }

    public Uri GetSasUrl(string blobName, string operation)
    {
        string containerName = string.Empty;
        var blobSasPermissions = BlobSasPermissions.List;
        switch (operation.ToUpperInvariant())
        {
            case "UPLOAD":
                blobSasPermissions |= BlobSasPermissions.Write;
                containerName = "upload";
                break;
            case "DOWNLOAD":
                blobSasPermissions |= BlobSasPermissions.Read;
                containerName = "private";
                break;
        }

        var blobContainerClient = new BlobContainerClient(connectionString, containerName);
        var blobClient = blobContainerClient.GetBlobClient(blobName);
        var uri = blobClient.GenerateSasUri(blobSasPermissions, DateTimeOffset.UtcNow.AddMinutes(5));
        return uri;
    }
}

public interface IChatGptClient
{
    Task<ChatCompletionResponse> GetChatCompletion(ChatCompletionRequest payload);
}

public class ChatGptClient : IChatGptClient
{
    private readonly ILogger<ChatGptClient> logger;
    private readonly HttpClient httpClient;
    private readonly string chatGptEndpoint;
    private readonly string chatGptToken;

    public ChatGptClient(
        ILogger<ChatGptClient> logger,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        this.logger = logger;
        this.httpClient = httpClient;
        chatGptEndpoint = "https://api.openai.com";
        chatGptToken = configuration["OPENAI_API_KEY"];
    }

    public async Task<ChatCompletionResponse> GetChatCompletion(ChatCompletionRequest payload)
    {
        string systemPrompt = payload.SystemPrompt;
        string userContent = payload.UserContent;

        var response = await SendChatCompletionRequest(systemPrompt, userContent);
        if (response.IsSuccessStatusCode)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            var chatCompletionResponse = JsonConvert.DeserializeObject<ChatCompletionResponse>(responseContent);

            return chatCompletionResponse;
        }
        else
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            logger.LogError($"Error occurred while processing chat completion: {errorContent}");
            throw new Exception("Server error, please try later. If this persists, please report the issue at https://github.com/blrchen/azure-speed-test/issues");
        }
    }

    private async Task<HttpResponseMessage> SendChatCompletionRequest(string systemPrompt, string userContent)
    {
        var requestBody = new StringContent(
            JsonConvert.SerializeObject(new
            {
                frequency_penalty = 0,
                max_tokens = 4000,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userContent }
                },
                model = "gpt-3.5-turbo",
                n = 1,
                presence_penalty = 0,
                stop = "",
                stream = false,
                temperature = 1,
                top_p = 1
            }),
            Encoding.UTF8,
            "application/json"
        );

        using var request = new HttpRequestMessage(HttpMethod.Post, chatGptEndpoint)
        {
            Headers =
            {
                { "Authorization", $"{chatGptToken}" }
            },
            Content = requestBody
        };

        return await httpClient.SendAsync(request);
    }
}