using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AzureSpeed.WebUI.Controllers
{
    public class AzureOnlineToolsController : Controller
    {
        // GET: AzureOnlineTools
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult EnableStorageCORS()
        {
            return View();
        }
    }
}