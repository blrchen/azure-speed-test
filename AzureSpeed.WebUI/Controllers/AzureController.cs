namespace AzureSpeed.WebUI
{
    using System;
    using System.Collections.Generic;
    using System.Net;
    using System.Web.Mvc;
    using Common;

    public class AzureController : BaseController
    {
        public ActionResult Index()
        {
            return View("Latency");
        }

        public ActionResult Latency()
        {
            return View();
        }

        public ActionResult CDN()
        {
            return View();
        }

        public ActionResult Upload()
        {
            return View();
        }

        public ActionResult UploadLargeFile()
        {
            return View();
        }

        public ActionResult Download()
        {
            return View();
        }

        public ActionResult LiveStreaming()
        {
            return View();
        }

        public ActionResult TrafficManager()
        {
            WebClient client = new WebClient();
            string ip = client.DownloadString("http://www.azurespeed.com/api/ip").Replace("\"", string.Empty).Trim();
            if (!string.IsNullOrEmpty(ip))
            {
                ViewBag.Ip = ip;
                var controller = new AzureApiController();
                ViewBag.Region = controller.GetRegionNameByIpOrUrl(ip);
            }

            return View();
        }

        public ActionResult Reference()
        {
            return View();
        }

        public ActionResult About()
        {
            return View();
        }

        public ActionResult Test()
        {
            return View();
        }

        public string EnableStorageCORS(StorageAccount account)
        {
            try
            {
                var storageAccount = new StorageContext(account);
            }
            catch (Exception ex)
            {
                logger.Error(ex);
                return "Failed due to Incorrect Account Name or Key.";
            }

            return "Enabling CORS Succeed";
        }
    }

    public class SasUrl
    {
        public string Storage { get; set; }

        public string Url { get; set; }
    }

    public class AwsIpRangeData
    {
        public string syncToken { get; set; }

        public string createDate { get; set; }

        public List<prefix> prefixes { get; set; }
    }

    public class prefix
    {
        public string ip_prefix { get; set; }

        public string region { get; set; }

        public string service { get; set; }
    }
}