using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AzureSpeed.WebUI.Controllers
{
    public class AzureOnlineToolsController : Controller
    {
        public ActionResult EnableStorageCORS()
        {
            return View();
        }

        public ActionResult GenerateEventHubSAS()
        {
            return View();
        }
    }
}