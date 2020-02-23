namespace AzureSpeed.Web.App.Controllers
{
    using Microsoft.AspNetCore.Mvc;

    public class CloudController : ControllerBase
    {
        public IActionResult RegionFinder()
        {
            return View();
        }

        // Redirection: /Cloud/IpRange => /Information/IpRange
        public IActionResult IpRange()
        {
            return RedirectToAction("IpRange", "Information");
        }
    }
}