namespace AzureSpeed.Web.App.Controllers
{
    using Microsoft.AspNetCore.Mvc;

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