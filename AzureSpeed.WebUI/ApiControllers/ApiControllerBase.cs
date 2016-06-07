namespace AzureSpeed.WebUI.ApiControllers
{
    using System.Web.Http;
    using Attributes;
    using NLog;

    [ActionExecutionFilter]
    public class ApiControllerBase : ApiController
    {
        protected readonly Logger Logger = LogManager.GetCurrentClassLogger();
    }
}
