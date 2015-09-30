using System;
using System.Diagnostics;
using System.Net;
using System.Threading.Tasks;
using System.Web.Hosting;
using System.Web.Http;
using AzureSpeed.WebUI.Models;
using LukeSkywalker.IPNetwork;
using NLog;

namespace AzureSpeed.WebUI.Controllers
{
    [RoutePrefix("api")]
    public class AzureApiController : ApiController
    {
        private Logger logger = LogManager.GetCurrentClassLogger();

        [HttpGet]
        [Route("getregion")]
        public IHttpActionResult GetRegionName(string ipOrUrl)
        {
            return Ok(GetRegionNameByIpOrUrl(ipOrUrl));
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
