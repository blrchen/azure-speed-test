namespace AzureSpeed.Web.App.Controllers
{
    using Microsoft.AspNetCore.Mvc;

    public class CloudController : ControllerBase
    {
        public IActionResult RegionFinder()
        {
            return View();
        }

        public IActionResult IpRange()
        {
            return View();
        }
    }
}