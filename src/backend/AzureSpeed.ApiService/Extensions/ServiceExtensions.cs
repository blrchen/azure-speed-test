using Microsoft.Extensions.DependencyInjection;

namespace AzureSpeed.ApiService.Extensions
{
    public static class ServiceExtensions
    {
        public static void AddCors(this IServiceCollection services, string policyName)
        {
            services.AddCors(options =>
            {
                options.AddPolicy(policyName, builder =>
                    builder.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
            });
        }
    }
}
