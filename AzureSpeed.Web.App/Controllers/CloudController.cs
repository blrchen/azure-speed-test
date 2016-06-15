namespace AzureSpeed.Web.App.Controllers
{
    using Microsoft.AspNetCore.Mvc;

    public class CloudController : Controller
    {
        public ActionResult RegionFinder()
        {
            return View();
        }

        public ActionResult IpRange()
        {
            return View();
        }
    }
}