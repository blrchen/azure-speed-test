using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Mvc;
using AzureSpeed.WebUI.Models;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage.Shared.Protocol;

namespace AzureSpeed.WebUI.Controllers
{
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

        public ActionResult CloudRegionFinder()
        {
            return View();
        }

        public ActionResult TrafficManager()
        {
            WebClient client = new WebClient();
            string ip = client.DownloadString("http://www.azurespeed.com/api/ip").Replace("\"", "").Trim();
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

        public string EnableStorageCORS(Account account)
        {
            try
            {
                var storageAccount = StorageUtils.CreateCloudStorageAccount(account);
                var blobClient = storageAccount.CreateCloudBlobClient();

                CorsHttpMethods allowedMethods = CorsHttpMethods.None;
                allowedMethods = allowedMethods | CorsHttpMethods.Get;
                allowedMethods = allowedMethods | CorsHttpMethods.Put;
                allowedMethods = allowedMethods | CorsHttpMethods.Post;
                allowedMethods = allowedMethods | CorsHttpMethods.Delete;
                allowedMethods = allowedMethods | CorsHttpMethods.Options;

                var delimiter = new[] { "," };
                CorsRule corsRule = new CorsRule();
                const string allowedOrigins = "*";
                const string allowedHeaders = "*";
                const string exposedHeaders = "";

                string[] allAllowedOrigin = allowedOrigins.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);
                string[] allExpHeaders = exposedHeaders.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);
                string[] allAllowHeaders = allowedHeaders.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);

                List<string> corsAllowedOrigin = new List<string>();
                foreach (var item in allAllowedOrigin)
                {
                    if (!string.IsNullOrWhiteSpace(item))
                    {
                        corsAllowedOrigin.Add(item.Trim());
                    }
                }
                List<string> corsExposedHeaders = new List<string>();
                foreach (var item in allExpHeaders)
                {
                    if (!string.IsNullOrWhiteSpace(item))
                    {
                        corsExposedHeaders.Add(item.Trim());
                    }
                }
                List<string> corsAllowHeaders = new List<string>();
                foreach (var item in allAllowHeaders)
                {
                    if (!string.IsNullOrWhiteSpace(item))
                    {
                        corsAllowHeaders.Add(item.Trim());
                    }
                }
                corsRule.MaxAgeInSeconds = 200;
                corsRule.AllowedMethods = allowedMethods;
                corsRule.AllowedHeaders = corsAllowHeaders;
                corsRule.AllowedOrigins = corsAllowedOrigin;
                corsRule.ExposedHeaders = corsExposedHeaders;
                ServiceProperties properties = blobClient.GetServiceProperties();
                properties.Cors.CorsRules.Clear();
                properties.Cors.CorsRules.Add(corsRule);
                blobClient.SetServiceProperties(properties);
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

    public class AwsIpRange
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