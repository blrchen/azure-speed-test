using Microsoft.AspNetCore.Mvc;

namespace AzureSpeed.Web.App.Controllers
{
    public class InformationController : ControllerBase
    {
        public IActionResult IpRange()
        {
            return View();
        }
    }
}