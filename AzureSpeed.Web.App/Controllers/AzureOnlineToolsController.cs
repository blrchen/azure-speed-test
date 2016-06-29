namespace AzureSpeed.Web.App.Controllers
{
    using Microsoft.AspNetCore.Mvc;

    public class AzureOnlineToolsController : ControllerBase
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