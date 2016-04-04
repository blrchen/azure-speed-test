namespace AzureSpeed.WebUI
{
    using System.Web.Mvc;

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