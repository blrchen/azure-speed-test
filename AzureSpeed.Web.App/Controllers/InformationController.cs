using Microsoft.AspNetCore.Mvc;

namespace AzureSpeed.Web.App.Controllers
{
    public class InformationController : ControllerBase
    {

        public IActionResult AzureBillingMeters()
        {
            return View();
        }

        public IActionResult AzureEnvironments()
        {
            return View();
        }

        public IActionResult AzureRegions()
        {
            return View();
        }

        public IActionResult AzureVMPricing()
        {
            return View();
        }

        public IActionResult IpRange()
        {
            return View();
        }

        public IActionResult References()
        {
            return View();
        }
    }
}