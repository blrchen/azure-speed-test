namespace AzureSpeed.Web.App.Controllers
{
    using Microsoft.AspNetCore.Mvc;

    public class AzureOnlineToolsController : Controller
    {
        public IActionResult EnableStorageCORS()
        {
            return View();
        }

        public IActionResult GenerateEventHubSAS()
        {
            return View();
        }
    }
}