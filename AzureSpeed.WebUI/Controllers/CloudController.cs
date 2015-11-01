using System;
using System.Collections.Generic;
using System.Configuration;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using System.Xml;
using AzureSpeed.WebUI.Models;
using System.Web.Hosting;

namespace AzureSpeed.WebUI.Controllers
{
    public class CloudController : Controller
    {
        public ActionResult RegionFinder()
        {
            return View();
        }

        public ActionResult IpRange()
        {
            return View();
        }
    }
}