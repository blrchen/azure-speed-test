namespace AzureSpeed.WebUI
{
    using System.Web.Http;
    using NLog;

    [ActionExecutionFilter]
    public class ApiControllerBase : ApiController
    {
        protected readonly Logger Logger = LogManager.GetCurrentClassLogger();
    }
}
