using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using AzureSpeed.WebApp.DataContracts;
using AzureSpeed.WebApp.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AzureSpeed.WebApp.ApiControllers
{
    [Route("api")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly HttpClient httpClient;
        private readonly ILogger<ApiController> logger;
        private readonly StorageAccountsContext storageAccountsContext;

        public ApiController(
            HttpClient httpClient,
            ILogger<ApiController> logger,
            StorageAccountsContext storageAccountsContext)
        {
            this.httpClient = httpClient;
            this.storageAccountsContext = storageAccountsContext;
            this.logger = logger;
        }

        [HttpGet]
        [Route("ipinfo")]
        public async Task<IActionResult> GetAzureIPInfo(string ipAddressOrUrl)
        {
            string url = $"https://azureiplookup.azurewebsites.net/api/ipinfo?ip={ipAddressOrUrl}";
            var result = await httpClient.GetStringAsync(url);
            return Ok(result);
        }

        [HttpGet]
        [Route("sas")]
        public IActionResult GetSasLink(string regionName, string blobName, string operation)
        {
            string url = "";
            if (!string.IsNullOrEmpty(regionName))
            {
                var account = storageAccountsContext.StorageAccounts.FirstOrDefault(v => v.LocationId == regionName);
                if (account != null)
                {
                    var storageContext = new StorageContext(account);
                    url = storageContext.GetSasUrl(blobName, operation);
                }
            }

            return Ok(new { Url = url });
        }

        [HttpPost]
        [Route("error")]
        public IActionResult LogError([FromBody] UIError error)
        {
            logger.LogError(error.Message);
            return Ok();
        }
    }
}