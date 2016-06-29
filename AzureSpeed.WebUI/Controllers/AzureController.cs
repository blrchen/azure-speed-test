namespace AzureSpeed.WebUI.Controllers
{
    using System;
    using System.Web.Mvc;
    using AzureSpeed.Common;

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