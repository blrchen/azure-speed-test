namespace AzureSpeed.WebUI
{
    using System;
    using System.Web.Mvc;
    using NLog;

    public class BaseController : Controller
    {
        protected static readonly Logger logger = LogManager.GetCurrentClassLogger();

        protected override void OnException(ExceptionContext filterContext)
        {
            if (filterContext == null)
            {
                throw new ArgumentNullException("filterContext");
            }
            logger.Error(filterContext.Exception);
            base.OnException(filterContext);
        }
    }
}