using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using System.Net;

namespace AzureSpeed.ApiService.Filters
{
    public class ApiExceptionFilter : IExceptionFilter
    {
        private readonly ILogger logger;

        public ApiExceptionFilter(ILogger<ApiExceptionFilter> logger)
        {
            this.logger = logger;
        }

        public void OnException(ExceptionContext context)
        {
            var contextException = context.Exception;
            if (context.Exception != null)
            {
                context.HttpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Result = new JsonResult(new
                {
                    message = "Server error occurred..."
                });
                logger.LogError($"Unhandled exception caught when processing http request, message: {contextException.Message}");
            }
        }
    }
}
