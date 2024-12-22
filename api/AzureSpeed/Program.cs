using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using AzureSpeed.WebApp;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Collections.Concurrent;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
ConfigureServices(builder);
var app = builder.Build();
ConfigureApp(app);
app.Run();

void ConfigureServices(WebApplicationBuilder builder)
{
    builder.Services.Configure<ApiBehaviorOptions>(options =>
    {
        options.SuppressModelStateInvalidFilter = true;
    });
    builder.Services.AddApplicationInsightsTelemetry(_ =>
    {
        _.EnableAdaptiveSampling = false;
        _.EnableRequestTrackingTelemetryModule = false;
    });
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAll", _ => { _.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod(); });
    });
    builder.Services.AddControllers();
    builder.Services.AddHttpClient();
    builder.Services.AddSingleton<IChatGptClient, ChatGptClient>();
    builder.Services.AddSingleton<IDictionary<string, StorageAccount>>(LoadStorageAccounts(builder.Environment));
}

IDictionary<string, StorageAccount> LoadStorageAccounts(IWebHostEnvironment environment)
{
    string settingsFilePath = Path.Combine(environment.ContentRootPath, "Data", "settings.json");
    string settingsContent = File.ReadAllText(settingsFilePath);
    var settings = JsonConvert.DeserializeObject<Settings>(settingsContent);
    return settings.Accounts.ToDictionary(account => account.LocationId);
}

void ConfigureApp(WebApplication app)
{
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }
    app.UseCors("AllowAll");
    app.MapControllers();
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

        string url = $"https://azureiplookup-westus3.azurewebsites.net/api/ipAddress?ipOrDomain={ipOrDomain}";
        string result = await httpClient.GetStringAsync(url);

        return Ok(result);
    }

    [HttpGet("serviceTags/{serviceTagId}")]
    public async Task<IActionResult> GetServiceTag([FromRoute] string serviceTagId, [FromQuery] string cloudId)
    {
        if (string.IsNullOrWhiteSpace(serviceTagId))
        {
            return BadRequest("Parameter serviceTagId cannot be null or empty.");
        }

        try
        {
            string url = $"https://azureiplookup-westus3.azurewebsites.net/api/serviceTags/{serviceTagId}?cloudId={cloudId}";
            string result = await httpClient.GetStringAsync(url);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch service tag information.");
            return StatusCode(500, "Failed to fetch data. Please try again later.");
        }
    }

    [HttpGet("serviceTags/{serviceTagId}/ipAddressPrefixes")]
    public async Task<IActionResult> GetIpAddressPrefixes([FromRoute] string serviceTagId, [FromQuery] string cloudId)
    {
        if (string.IsNullOrWhiteSpace(serviceTagId))
        {
            return BadRequest("Parameter serviceTagId cannot be null or empty.");
        }

        try
        {
            string url = $"https://azureiplookup-westus3.azurewebsites.net/api/serviceTags/{serviceTagId}/ipAddressPrefixes?cloudId={cloudId}";
            string result = await httpClient.GetStringAsync(url);
            return Ok(result);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch IP address prefixes.");
            return StatusCode(500, "Failed to fetch data. Please try again later.");
        }
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
    public async Task<IActionResult> GetChatCompletion([FromBody] ChatCompletionRequest request)
    {
        try
        {
            request.SystemPrompt = SystemPrompts.GetPromptById(request.SystemPromptId, webHostEnvironment.ContentRootPath);
            request.SystemPrompt = request.SystemPrompt.Replace("{{question}}", request.UserContent);

            if (!string.IsNullOrWhiteSpace(request.ResponseLanguage))
            {
                request.SystemPrompt = request.SystemPrompt.Replace("{{ResponseLanguage}}", request.ResponseLanguage);
            }
            if (!string.IsNullOrWhiteSpace(request.ProgramLanguage))
            {
                request.SystemPrompt = request.SystemPrompt.Replace("{{ProgramLanguage}}", request.ProgramLanguage);
            }

            var response = await chatGptClient.GetChatCompletion(request);
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
    private static readonly ConcurrentDictionary<string, string> promptsCache = new ConcurrentDictionary<string, string>();

    public static string GetPromptById(string id, string contentRootPath)
    {
        return promptsCache.GetOrAdd(id, _ => LoadPrompt(id, contentRootPath));
    }

    private static string LoadPrompt(string id, string contentRootPath)
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
                blobSasPermissions |= BlobSasPermissions.Write | BlobSasPermissions.Create | BlobSasPermissions.Add;
                containerName = "upload";
                break;
            case "DOWNLOAD":
                blobSasPermissions |= BlobSasPermissions.Read;
                containerName = "private";
                break;
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

        Uri sasUri = blobClient.GenerateSasUri(sasBuilder);
        return sasUri;
    }
}

public interface IChatGptClient
{
    Task<ChatCompletionResponse> GetChatCompletion(ChatCompletionRequest request);
}

public class ChatGptClient : IChatGptClient
{
    private readonly ILogger<ChatGptClient> logger;
    private readonly HttpClient httpClient;
    private readonly string chatGPT3Endpoint;

    public ChatGptClient(
        ILogger<ChatGptClient> logger,
        HttpClient httpClient, IConfiguration configuration)
    {
        this.logger = logger;
        this.httpClient = httpClient;
        this.chatGPT3Endpoint = configuration.GetValue<string>("ChatGPT3Endpoint");
    }

    public async Task<ChatCompletionResponse> GetChatCompletion(ChatCompletionRequest request)
    {
        HttpResponseMessage response = null;
        ChatCompletionResponse chatCompletionResponse = null;

        response = await SendChatCompletionRequest(request.SystemPrompt, request.UserContent);
        if (response.IsSuccessStatusCode)
        {
            var responseContent = await response.Content.ReadAsStringAsync();
            chatCompletionResponse = JsonConvert.DeserializeObject<ChatCompletionResponse>(responseContent);
        }
        else
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            logger.LogError($"Error occurred while processing chat completion: {errorContent}");
            throw new Exception("Server error, please try later. If this persists, please report the issue at https://github.com/blrchen/azure-speed-test/issues");
        }

        return chatCompletionResponse;
    }

    private async Task<HttpResponseMessage> SendChatCompletionRequest(string systemPrompt, string userContent)
    {
        var requestBody = new StringContent(
            JsonConvert.SerializeObject(new
            {
                max_tokens = 4000,
                messages = new[]
                {
                    new { role = "system", content = systemPrompt },
                    //new { role = "user", content = userContent }
                },
                model = "gpt-3.5-turbo",
                n = 1,
                stop = "",
                stream = false,
                temperature = 1,
                top_p = 1
            }),
            Encoding.UTF8,
            "application/json"
        );
        using var request = new HttpRequestMessage(HttpMethod.Post, this.chatGPT3Endpoint)
        {
            Content = requestBody
        };
        return await httpClient.SendAsync(request);
    }
}