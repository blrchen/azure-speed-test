using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AzureSpeed.ApiService.Contracts;
using AzureSpeed.ApiService.Providers;
using AzureSpeed.Common.LocalData;
using AzureSpeed.Common.Storage;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AzureSpeed.ApiService.ApiControllers
{
    [Route("api")]
    public class ApiController : Controller
    {
        private readonly IAzureIPInfoProvider azureIPInfoProvider;
        private readonly ILogger<ApiController> logger;
        private readonly LocalDataStoreContext localDataStoreContext;

        public ApiController(
            IAzureIPInfoProvider azureIPInfoProvider,
            ILogger<ApiController> logger,
            IWebHostEnvironment webHostEnvironment)
        {
            this.azureIPInfoProvider = azureIPInfoProvider;
            this.logger = logger;
            this.localDataStoreContext = new LocalDataStoreContext(webHostEnvironment.ContentRootPath);
        }

        [HttpGet]
        [Route("ipinfo")]
        public async Task<IActionResult> GetRegionInfo(string ipAddressOrUrl)
        {
            logger.LogInformation($"Get ip info for {ipAddressOrUrl}");
            var result = await this.azureIPInfoProvider.GetAzureIPInfo(ipAddressOrUrl);
            return Ok(result);
        }

        [HttpGet]
        [Route("sas")]
        public IActionResult GetSasLink(string locationId, string blobName, string operation)
        {
            string url = "";
            if (!string.IsNullOrEmpty(locationId))
            {
                var account = localDataStoreContext.StorageAccounts.FirstOrDefault(v => v.LocationId == locationId);
                if (account != null)
                {
                    var storageContext = new StorageContext(account);
                    url = storageContext.GetSasUrl(blobName, operation);
                }
            }

            return Ok(new { Url = url });
        }

        [HttpGet]
        [Route("download")]
        public IActionResult GetDownloadLink()
        {
            var files = new List<DownloadFileInfo>();
            foreach (var account in localDataStoreContext.StorageAccounts)
            {
                var storageContext = new StorageContext(account);
                files.Add(new DownloadFileInfo() { Region = account.LocationId, Url = storageContext.GetSasUrl("100MB.bin", "download") });
            }

            return Ok(files);
        }
    }
}