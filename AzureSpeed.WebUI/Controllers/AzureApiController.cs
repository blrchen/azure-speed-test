using System;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Hosting;
using System.Web.Http;
using AzureSpeed.WebUI.Models;
using LukeSkywalker.IPNetwork;
using Microsoft.WindowsAzure.Storage.Blob;
using NLog;

namespace AzureSpeed.WebUI.Controllers
{
    [RoutePrefix("api")]
    public class AzureApiController : ApiController
    {
        private Logger logger = LogManager.GetCurrentClassLogger();

        [HttpGet]
        [Route("ip")]
        public IHttpActionResult GetIp()
        {
            var ip = ((HttpContextBase)Request.Properties["MS_HttpContext"]).Request.UserHostAddress;
            return Ok(ip);
        }

        [HttpGet]
        [Route("region")]
        public IHttpActionResult GetRegionName(string ipOrUrl)
        {
            return Ok(GetRegionNameByIpOrUrl(ipOrUrl));
        }

        [HttpGet]
        [Route("sas")]
        public IHttpActionResult GetSasLink(string region, string blobName, string operations)
        {
            string url = "";
            if (!string.IsNullOrEmpty(region))
            {
                var account = AzureSpeedData.Accounts.FirstOrDefault(v => v.Region == region);
                if (account != null)
                {
                    var storageAccount = StorageUtils.CreateCloudStorageAccount(account, true);
                    var blobClient = storageAccount.CreateCloudBlobClient();
                    var container = blobClient.GetContainerReference("azurespeed");
                    var blob = container.GetBlockBlobReference(blobName);
                    var permissions = SharedAccessBlobPermissions.None;
                    if (operations.ToLower().Contains("upload"))
                    {
                        permissions |= SharedAccessBlobPermissions.Write;
                    }
                    if (operations.ToLower().Contains("download"))
                    {
                        permissions |= SharedAccessBlobPermissions.Read;
                    }
                    url = StorageUtils.GetSasUrl(blob, permissions);
                }
            }
            return Ok(url);
        }

        [HttpGet]
        [Route("cleanup")]
        public IHttpActionResult DeleteOutDatedBlobs()
        {
            foreach (var account in AzureSpeedData.Accounts)
            {
                var storageAccount = StorageUtils.CreateCloudStorageAccount(account);
                var blobClient = storageAccount.CreateCloudBlobClient();
                var container = blobClient.GetContainerReference("azurespeed");
                var blobs = container.ListBlobs();
                var oneMonthAgo = DateTimeOffset.Now.AddMonths(-1);
                foreach (IListBlobItem blob in blobs)
                {
                    var cblob = blob as ICloudBlob;
                    if (cblob != null && cblob.Name != "callback.js" && cblob.Name != "100MB.bin")
                    {
                        if (cblob.Properties.LastModified.Value.CompareTo(oneMonthAgo) < 0)
                        {
                            cblob.DeleteAsync();
                        }
                    }
                }
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
                ipFilePath = HostingEnvironment.MapPath("~/App_Data/");
            }

            if (!(ipOrUrl.StartsWith("http://") || ipOrUrl.StartsWith("https://")))
            {
                ipOrUrl = "http://" + ipOrUrl;
            }
            Uri tmp = new Uri(ipOrUrl);
            ipOrUrl = tmp.Host;


            var sw = new Stopwatch();
            sw.Start();
            try
            {
                var ips = Dns.GetHostAddresses(ipOrUrl);
                var ipAddr = ips[0];
                var subnets = SubnetBuilder.GetSubnetDictionary(ipFilePath);
                foreach (IPNetwork net in subnets.Keys)
                {
                    if (IPNetwork.Contains(net, ipAddr))
                    {
                        var regionAlias = subnets[net];
                        sw.Stop();
                        string region = AzureSpeedData.RegionNames[regionAlias];
                        logger.Info("IpOrUrl = {0}, region = {1}, time = {2}", ipOrUrl, region, sw.ElapsedMilliseconds);
                        return region;
                    }
                }
            }
            catch (Exception ex)
            {
                logger.Error(ex);
                return "Invalid Address!";
            }
            return "Region not found";
        }
    }
}
