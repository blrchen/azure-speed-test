using System.Collections.Generic;
using System.Linq;
using AzureSpeed.Common.LocalData;
using AzureSpeed.Common.Models.Responses;
using AzureSpeed.Common.Models.ViewModels;
using AzureSpeed.Common.Storage;
using AzureSpeed.Web.App.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AzureSpeed.Web.App.ApiControllers
{
    [Route("api")]
    public class ApiController : Controller
    {
        private readonly IHostingEnvironment hostingEnvironment;
        private readonly IOptions<AppSettings> appSettings;
        private readonly LocalDataStoreContext localDataStoreContext;

        public ApiController(IHostingEnvironment hostingEnvironment, IOptions<AppSettings> appSettings)
        {
            this.hostingEnvironment = hostingEnvironment;
            this.appSettings = appSettings;
            this.localDataStoreContext = new LocalDataStoreContext(hostingEnvironment.ContentRootPath,
                appSettings.Value.AzureIpRangeFileList, appSettings.Value.AwsIpRangeFile,
                appSettings.Value.AliCloudIpRangeFile);
        }

        [HttpGet]
        [Route("region")]
        public RegionInfo GetRegionInfo(string ipOrUrl)
        {
            return this.localDataStoreContext.GetRegionInfoByIpOrUrl(ipOrUrl);
        }

        [HttpGet]
        [Route("iprange")]
        public IEnumerable<IpRangeViewModel> GetIpRange()
        {
            return this.localDataStoreContext.GetIpRange();
        }

        [HttpGet]
        [Route("sas")]
        public string GetSasLink(string region, string blobName, string operation)
        {
            string url = string.Empty;
            if (!string.IsNullOrEmpty(region))
            {
                var account = localDataStoreContext.StorageAccounts.FirstOrDefault(v => v.Region == region);
                if (account != null)
                {
                    var storageContext = new StorageContext(account);
                    url = storageContext.GetSasUrl(blobName, operation);
                }
            }

            return url;
        }

        [HttpGet]
        [Route("cleanup")]
        public string CleanUpBlobs()
        {
            foreach (var account in localDataStoreContext.StorageAccounts)
            {
                var storageAccount = new StorageContext(account);
                storageAccount.CleanUpBlobs();
            }

            return string.Empty;
        }
    }
}