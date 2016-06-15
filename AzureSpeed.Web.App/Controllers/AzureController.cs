namespace AzureSpeed.Web.App.Controllers
{
    using System;
    using System.Net;
    using Common;
    using Microsoft.AspNetCore.Mvc;
    using WebUI.ApiControllers;
    using AzureApiController = ApiControllers.AzureApiController;

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
                Logger.Error(ex);
                return "Failed due to Incorrect Account Name or Key.";
            }

            return "Enabling CORS Succeed";
        }
    }
}