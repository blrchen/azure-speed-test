using AzureSpeed.Common;
using AzureSpeed.Common.LocalData;
using AzureSpeed.Common.Models.Responses;
using AzureSpeed.Common.Models.ViewModels;
using AzureSpeed.Common.Storage;
using AzureSpeed.Web.App.Filters;
using AzureSpeed.Web.App.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace AzureSpeed.Web.App.ApiControllers
{
    [Route("api")]
    [ApiExceptionFilter]
    public class ApiController : Controller
    {
        private readonly IFileProvider fileProvider;
        private readonly LocalDataStoreContext localDataStoreContext;

        public ApiController(IOptions<AppSettings> appSettings, IFileProvider fileProvider, IWebHostEnvironment webHostEnvironment)
        {
            this.fileProvider = fileProvider;
            this.localDataStoreContext = new LocalDataStoreContext(
                webHostEnvironment.ContentRootPath,
                appSettings.Value.AzureIpRangeFileList,
                appSettings.Value.AwsIpRangeFile,
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
        public object GetSasLink(string locationId, string blobName, string operation)
        {
            string url = string.Empty;
            if (!string.IsNullOrEmpty(locationId))
            {
                var account = localDataStoreContext.StorageAccounts.FirstOrDefault(v => v.LocationId == locationId);
                if (account != null)
                {
                    var storageContext = new StorageContext(account);
                    url = storageContext.GetSasUrl(blobName, operation);
                }
            }

            return new { Url = url };
        }

        [HttpGet]
        [Route("download")]
        public List<DownloadFile> GetDownloadLink()
        {
            var files = new List<DownloadFile>();
            foreach (var account in localDataStoreContext.StorageAccounts)
            {
                var storageContext = new StorageContext(account);
                files.Add(new DownloadFile() { Region = account.LocationId, Url = storageContext.GetSasUrl("100MB.bin", "download") });
            }

            return files;
        }

        [HttpGet]
        [Route("billingmeters")]
        public string GetBillingMeters()
        {
            var file = fileProvider.GetFileInfo("Data/ratecard.json");
            string result;
            using (var stream = file.CreateReadStream())
            {
                using (var reader = new StreamReader(stream))
                {
                    result = reader.ReadToEnd();
                }
            }

            return result;
        }

        [HttpGet]
        [Route("vmslugs")]
        public string GetAzureVMSlugs()
        {
            var file = fileProvider.GetFileInfo("Data/vmslugs.json");
            string result;
            using (var stream = file.CreateReadStream())
            {
                using (var reader = new StreamReader(stream))
                {
                    result = reader.ReadToEnd();
                }
            }

            return result;
        }
    }
}