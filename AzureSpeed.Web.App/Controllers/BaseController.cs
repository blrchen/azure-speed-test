namespace AzureSpeed.Web.App.Controllers
{
    using Microsoft.AspNetCore.Mvc;

    public class BaseController : Controller
    {
        // todo: Figure out how to handle uncaught error

        //protected static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        //protected override void OnException(ExceptionContext filterContext)
        //{
        //    if (filterContext == null)
        //    {
        //        throw new ArgumentNullException(nameof(filterContext));
        //    }

        //    Logger.Error(filterContext.Exception);
        //    base.OnException(filterContext);
        //}
    }
}