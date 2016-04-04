namespace AzureSpeed.WebUI
{
    using System.Web.Mvc;

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