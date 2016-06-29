namespace AzureSpeed.Web.App.ApiControllers
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Linq;
    using System.Net;
    using System.Xml;
    using AzureSpeed.Common;
    using AzureSpeed.Common.Models;
    using Common;
    using LukeSkywalker.IPNetwork;
    using Microsoft.AspNetCore.Hosting;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Options;
    using Newtonsoft.Json;

    [Route("api")]
    public class AzureApiController : ApiControllerBase
    {
        private readonly IHostingEnvironment hostingEnvironment;
        private readonly IOptions<AppSettings> appSettings;
        private readonly LocalDataStoreContext localDataStoreContext;

        public AzureApiController(IHostingEnvironment hostingEnvironment, IOptions<AppSettings> appSettings)
        {
            this.hostingEnvironment = hostingEnvironment;
            this.appSettings = appSettings;
            this.localDataStoreContext = new LocalDataStoreContext(hostingEnvironment.ContentRootPath);
        }

        [HttpGet]
        [Route("ip")]
        public IActionResult GetIp()
        {
            var remoteIpAddress = HttpContext.Connection.RemoteIpAddress;
            return Ok(remoteIpAddress);
        }

        [HttpGet]
        [Route("region")]
        public IActionResult GetRegionName(string ipOrUrl)
        {
            return Ok(GetRegionNameByIpOrUrl(ipOrUrl));
        }

        [HttpGet]
        [Route("iprange")]
        public IActionResult GetIpRange()
        {
            return Ok(GetSubnetList());
        }

        [HttpGet]
        [Route("sas")]
        public IActionResult GetSasLink(string region, string blobName, string operation)
        {
            string url = string.Empty;
            if (!string.IsNullOrEmpty(region))
            {
                var account = localDataStoreContext.Accounts.FirstOrDefault(v => v.Region == region);
                if (account != null)
                {
                    var storageContext = new StorageContext(account);
                    url = storageContext.GetSasUrl(blobName, operation);
                }
            }

            return Ok(url);
        }

        [HttpGet]
        [Route("cleanup")]
        public IActionResult CleanUpBlobs()
        {
            foreach (var account in localDataStoreContext.Accounts)
            {
                var storageAccount = new StorageContext(account);
                storageAccount.CleanUpBlobs();
            }

            return Ok();
        }

        public string GetRegionNameByIpOrUrl(string ipOrUrl, string ipFilePath = null)
        {
            if (string.IsNullOrEmpty(ipOrUrl))
            {
                return "Must specify a valid ipAddress or url";
            }

            if (string.IsNullOrEmpty(ipFilePath))
            {
                ipFilePath = hostingEnvironment.ContentRootPath + @"\App_Data";
            }

            if (!(ipOrUrl.StartsWith("http://") || ipOrUrl.StartsWith("https://")))
            {
                ipOrUrl = "http://" + ipOrUrl;
            }

            Uri tmp = new Uri(ipOrUrl);
            ipOrUrl = tmp.Host;

            var sw = new Stopwatch();
            sw.Start();

            var ips = Dns.GetHostAddresses(ipOrUrl);
            var ipAddr = ips[0];
            var subnetContext = new SubnetContext(ipFilePath, appSettings.Value.AzureIpRangeFileList, appSettings.Value.AwsIpRangeFile, appSettings.Value.AliCloudIpRangeFile);
            var subnets = subnetContext.GetSubnetData();
            foreach (var net in subnets.Keys)
            {
                if (IPNetwork.Contains(net, ipAddr))
                {
                    var regionAlias = subnets[net];
                    sw.Stop();
                    string region = localDataStoreContext.RegionNames[regionAlias];
                    //Logger.Info($"IpOrUrl = {ipOrUrl}, region = {region}, time = {sw.ElapsedMilliseconds}");
                    return region;
                }
            }

            return "Region not found";
        }

        public List<IpRangeViewModel> GetSubnetList(string ipFilePath = null)
        {
            if (string.IsNullOrEmpty(ipFilePath))
            {
                ipFilePath = hostingEnvironment.ContentRootPath + (@"\App_Data");
            }

            var result = new List<IpRangeViewModel>();

            // Load Azure ip range data
            string ipFileList = appSettings.Value.AzureIpRangeFileList;
            foreach (string filePath in ipFileList.Split(';'))
            {
                var xmlDoc = new XmlDocument();
                xmlDoc.Load(ipFilePath + @"\IpRangeFiles\Azure\" + filePath);
                var root = xmlDoc.DocumentElement;
                foreach (XmlElement ele in root)
                {
                    string region = ele.GetAttribute("Name");
                    var ipRange = new IpRangeViewModel { Cloud = "Azure", Region = region, Subnet = new List<string>() };
                    foreach (XmlElement xe in ele)
                    {
                        string subnet = xe.GetAttribute("Subnet");
                        ipRange.Subnet.Add(subnet);
                        var network = IPNetwork.Parse(subnet);
                        ipRange.TotalIpCount += network.Total;
                    }

                    result.Add(ipRange);
                }
            }

            // Load AWS ip range data
            string awsIpFile = this.appSettings.Value.AwsIpRangeFile;
            string json = System.IO.File.ReadAllText(ipFilePath + @"\IpRangeFiles\AWS\" + awsIpFile);
            var awsIpRangeData = JsonConvert.DeserializeObject<AwsIpRangeData>(json);
            foreach (var prefix in awsIpRangeData.Prefixes)
            {
                string region = prefix.Region;
                string subnet = prefix.IpPrefix;
                if (result.Any(v => v.Region == region))
                {
                    var ipRange = result.First(v => v.Region == region);
                    ipRange.Subnet.Add(subnet);
                    var network = IPNetwork.Parse(subnet);
                    ipRange.TotalIpCount += network.Total;
                }
                else
                {
                    var ipRange = new IpRangeViewModel { Cloud = "AWS", Region = region, Subnet = new List<string>() };
                    ipRange.Subnet.Add(subnet);
                    var network = IPNetwork.Parse(subnet);
                    ipRange.TotalIpCount += network.Total;
                    result.Add(ipRange);
                }
            }

            // Load AliCloud ip range data
            string aliCloudIpFile = appSettings.Value.AliCloudIpRangeFile;
            string[] lines = System.IO.File.ReadAllLines(ipFilePath + @"\IpRangeFiles\AliCloud\" + aliCloudIpFile);
            var aliIpRange = new IpRangeViewModel { Cloud = "AliCloud", Region = "AliCloud", Subnet = new List<string>() };
            foreach (var line in lines)
            {
                string subnet = line;
                aliIpRange.Subnet.Add(subnet);
                var network = IPNetwork.Parse(subnet);
                aliIpRange.TotalIpCount += network.Total;
            }

            result.Add(aliIpRange);

            return result;
        }
    }
}