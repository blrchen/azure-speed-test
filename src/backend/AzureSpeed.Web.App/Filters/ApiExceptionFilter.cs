using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Net;
using System.Threading.Tasks;

namespace AzureSpeed.Web.App.Filters
{
    // https://weblog.west-wind.com/posts/2016/Oct/16/Error-Handling-and-ExceptionFilter-Dependency-Injection-for-ASPNET-Core-APIs
    public sealed class ApiExceptionFilter : ExceptionFilterAttribute
    {
        /// <summary>
        /// OnException
        /// </summary>
        /// <param name="context">Context</param>
        public override void OnException(ExceptionContext context)
        {
            if (context.Exception != null)
            {
                if (context.Exception is TaskCanceledException || context.Exception is OperationCanceledException)
                {
                    // This is a known issue in ASP.NET Web API 2, the problem is that it returns a cancelled task to ASP.NET in this case,
                    // and ASP.NET treats a cancelled task like an unhandled exception:
                    context.ExceptionHandled = true;
                }
                else
                {
                    context.HttpContext.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    context.Result = new JsonResult(new
                    {
                        message = "Server error occurred..."
                    });
                }
            }

            base.OnException(context);
        }
    }
}
