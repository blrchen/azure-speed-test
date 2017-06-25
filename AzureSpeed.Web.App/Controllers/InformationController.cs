using Microsoft.AspNetCore.Mvc;

namespace AzureSpeed.Web.App.Controllers
{
    public class InformationController : ControllerBase
    {
        public IActionResult AzureEnvironments()
        {
            return View();
        }

        public IActionResult AzureRegions()
        {
            return View();
        }

        public IActionResult AzureBillingMeters()
        {
            return View();
        }

        public IActionResult IpRange()
        {
            return View();
        }
    }
}