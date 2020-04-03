using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using System.Xml;
using AzureSpeed.ApiService.Contracts;
using AzureSpeed.ApiService.Providers;
using AzureSpeed.ApiService.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace AzureSpeed.ApiService.ApiControllers
{
    [Route("api")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly IAzureIPInfoProvider azureIPInfoProvider;
        private readonly IFileProvider fileProvider;
        private readonly ILogger<ApiController> logger;
        private readonly StorageAccountsContext storageAccountsContext;

        public ApiController(
            IAzureIPInfoProvider azureIPInfoProvider,
            IFileProvider fileProvider,
            ILogger<ApiController> logger,
            StorageAccountsContext storageAccountsContext)
        {
            this.azureIPInfoProvider = azureIPInfoProvider;
            this.fileProvider = fileProvider;
            this.storageAccountsContext = storageAccountsContext;
            this.logger = logger;
        }

        [HttpGet]
        [Route("ipinfo")]
        public async Task<IActionResult> GetRegionInfo(string ipAddressOrUrl)
        {
            var result = await this.azureIPInfoProvider.GetAzureIPInfo(ipAddressOrUrl);
            logger.LogInformation($"Get ip info for {ipAddressOrUrl}, result = {JsonConvert.SerializeObject(result)}");
            return Ok(result);
        }

        [HttpGet]
        [Route("sas")]
        public IActionResult GetSasLink(string locationId, string blobName, string operation)
        {
            string url = "";
            if (!string.IsNullOrEmpty(locationId))
            {
                var account = storageAccountsContext.StorageAccounts.FirstOrDefault(v => v.LocationId == locationId);
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
            foreach (var account in storageAccountsContext.StorageAccounts)
            {
                var storageContext = new StorageContext(account);
                files.Add(new DownloadFileInfo() { Region = account.LocationId, Url = storageContext.GetSasUrl("100MB.bin", "download") });
            }

            return Ok(files);
        }

        [HttpGet]
        [Route("iprange")]
        public IActionResult GetIpRange()
        {
            var result = new List<AzureIPRangeInfo>();

            string ipFileList = Constants.Constants.AzureIpRangeFileList;
            foreach (string filePath in ipFileList.Split(';'))
            {
                var file = fileProvider.GetFileInfo($"Data/IpRangeFiles/Azure/{filePath}");
                var xmlDoc = new XmlDocument();
                xmlDoc.Load(file.PhysicalPath);
                var root = xmlDoc.DocumentElement;
                foreach (XmlElement ele in root)
                {
                    string region = ele.GetAttribute("Name");
                    var ipRange = new AzureIPRangeInfo { Cloud = "Azure", Region = region, Subnet = new List<string>() };
                    foreach (XmlElement xe in ele)
                    {
                        string subnet = xe.GetAttribute("Subnet");
                        ipRange.Subnet.Add(subnet);
                        ipRange.TotalIpCount += IPNetwork.Parse(subnet).Total;
                    }

                    result.Add(ipRange);
                }
            }

            result.ForEach(r => r.TotalIp = r.TotalIpCount.ToString());

            return Ok(result);
        }

        [HttpGet]
        [Route("billingmeters")]
        public IActionResult GetBillingMeters()
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

            return Ok(result);
        }

        [HttpGet]
        [Route("vmslugs")]
        public IActionResult GetAzureVMSlugs()
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

            return Ok(result);
        }
    }
}