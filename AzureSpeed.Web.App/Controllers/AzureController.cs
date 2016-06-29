namespace AzureSpeed.Web.App.Controllers
{
    using System;
    using System.Net;
    using AzureSpeed.Common;
    using Microsoft.AspNetCore.Mvc;

    public class AzureController : ControllerBase
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
            catch (Exception)
            {
                return "Failed due to Incorrect Account Name or Key.";
            }

            return "Enabling CORS Succeed";
        }
    }
}