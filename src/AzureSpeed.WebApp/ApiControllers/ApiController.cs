using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using AzureSpeed.WebApp.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AzureSpeed.WebApp.ApiControllers
{
    [Route("api")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly IHttpClientFactory httpClientFactory;
        private readonly ILogger<ApiController> logger;
        private readonly StorageAccountsProvider storageAccountsProvider;

        public ApiController(
            IHttpClientFactory httpClientFactory,
            ILogger<ApiController> logger,
            StorageAccountsProvider storageAccountsProvider)
        {
            this.httpClientFactory = httpClientFactory;
            this.storageAccountsProvider = storageAccountsProvider;
            this.logger = logger;
        }

        [HttpGet]
        [Route("ipinfo")]
        public async Task<IActionResult> GetAzureIPInfo(string ipAddressOrUrl)
        {
            string url = $"https://azureiplookup.azurewebsites.net/api/ipinfo?ipOrDomain={ipAddressOrUrl}";
            string result = await this.httpClientFactory.CreateClient().GetStringAsync(url);
            return Ok(result);
        }

        [HttpGet]
        [Route("sas")]
        public IActionResult GetSasLink(string regionName, string blobName, string operation)
        {
            string url = "";
            if (!string.IsNullOrEmpty(regionName))
            {
                var account = storageAccountsProvider.StorageAccounts.FirstOrDefault(v => v.LocationId == regionName);
                if (account != null)
                {
                    var storageContext = new StorageProvider(account);
                    url = storageContext.GetSasUrl(blobName, operation);
                }
            }

            return Ok(new { Url = url });
        }
    }
}