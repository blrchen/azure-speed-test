namespace AzureSpeed.WebUI.Attributes
{
    using System.Web.Http.Filters;
    using NLog;

    public class ActionExecutionFilterAttribute : ActionFilterAttribute
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();

        public override void OnActionExecuted(HttpActionExecutedContext context)
        {
            if (context.Exception != null)
            {
                Logger.Error(
                    context.Exception,
                    $"Execute request exception: url: {context.Request.RequestUri}",
                    context.ActionContext.ActionArguments);
            }

            base.OnActionExecuted(context);
        }
    }
}