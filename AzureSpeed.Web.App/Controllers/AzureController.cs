using AzureSpeed.Common;

namespace AzureSpeed.Web.App.Controllers
{
    using System;
    using System.Net;
    using ApiControllers;
    using Common;
    using Microsoft.AspNetCore.Mvc;

    public class AzureController : BaseController
    {
        public IActionResult Index()
        {
            return View("Latency");
        }

        public IActionResult Latency()
        {
            return View();
        }

        public IActionResult CDN()
        {
            return View();
        }

        public IActionResult Upload()
        {
            return View();
        }

        public IActionResult UploadLargeFile()
        {
            return View();
        }

        public IActionResult Download()
        {
            return View();
        }

        public IActionResult TrafficManager()
        {
            WebClient client = new WebClient();
            string ip = client.DownloadString("http://www.azurespeed.com/api/ip").Replace("\"", string.Empty).Trim();
            if (!string.IsNullOrEmpty(ip))
            {
                ViewBag.Ip = ip;
                // todo: cleanup
                //var controller = new AzureApiController();
                //ViewBag.Region = controller.GetRegionNameByIpOrUrl(ip);
            }

            return View();
        }

        public IActionResult Reference()
        {
            return View();
        }

        public IActionResult About()
        {
            return View();
        }

        public IActionResult Test()
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