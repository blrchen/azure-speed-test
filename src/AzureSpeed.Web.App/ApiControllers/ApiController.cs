using System.Collections.Generic;
using System.IO;
using System.Linq;
using AzureSpeed.Common.LocalData;
using AzureSpeed.Common.Models.Responses;
using AzureSpeed.Common.Models.ViewModels;
using AzureSpeed.Common.Storage;
using AzureSpeed.Web.App.Common;
using AzureSpeed.Web.App.Filters;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

namespace AzureSpeed.Web.App.ApiControllers
{
    [Route("api")]
    [ApiExceptionFilter]
    public class ApiController : Controller
    {
        private readonly IOptions<AppSettings> appSettings;
        private readonly IFileProvider fileProvider;
        private readonly IHostingEnvironment hostingEnvironment;
        private readonly LocalDataStoreContext localDataStoreContext;

        public ApiController(IOptions<AppSettings> appSettings, IFileProvider fileProvider, IHostingEnvironment hostingEnvironment)
        {
            this.appSettings = appSettings;
            this.fileProvider = fileProvider;
            this.hostingEnvironment = hostingEnvironment;
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
                files.Add(new DownloadFile(){ Region = account.LocationId , Url = storageContext.GetSasUrl("100MB.bin", "download") });
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

        //[HttpGet]
        //[Route("cleanup")]
        //public string CleanUpBlobs()
        //{
        //    foreach (var account in localDataStoreContext.StorageAccounts)
        //    {
        //        var storageAccount = new StorageContext(account);
        //        storageAccount.CleanUpBlobs();
        //    }

        //    return string.Empty;
        //}
    }

    public class DownloadFile
    {
        public string Region { get; set; }
        public string Url { get; set; }
    }
}