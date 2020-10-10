using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Xml;
using AzureSpeed.WebApp.Contracts;
using AzureSpeed.WebApp.Providers;
using AzureSpeed.WebApp.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace AzureSpeed.WebApp.ApiControllers
{
    [Route("api")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly IAzureIPInfoProvider azureIPInfoProvider;
        private readonly ILogger<ApiController> logger;
        private readonly StorageAccountsContext storageAccountsContext;

        public ApiController(
            IAzureIPInfoProvider azureIPInfoProvider,
            ILogger<ApiController> logger,
            StorageAccountsContext storageAccountsContext)
        {
            this.azureIPInfoProvider = azureIPInfoProvider;
            this.storageAccountsContext = storageAccountsContext;
            this.logger = logger;
        }

        [HttpGet]
        [Route("ipinfo")]
        public async Task<IActionResult> GetAzureIPInfo(string ipAddressOrUrl)
        {
            var result = await this.azureIPInfoProvider.GetAzureIPInfo(ipAddressOrUrl);
            logger.LogInformation($"Get ip info for {ipAddressOrUrl}, result = {JsonConvert.SerializeObject(result)}");
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