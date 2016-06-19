namespace AzureSpeed.Web.App.ApiControllers
{
    using Microsoft.AspNetCore.Mvc;
    using NLog;

    //[ActionExecutionFilter]
    public class ApiControllerBase : Controller
    {
        protected readonly Logger Logger = LogManager.GetCurrentClassLogger();
    }
}
