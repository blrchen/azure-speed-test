using AzureSpeed.ApiService.Extensions;
using AzureSpeed.ApiService.Filters;
using AzureSpeed.ApiService.Providers;
using AzureSpeed.ApiService.Storage;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace AzureSpeed.ApiService
{
    public class Startup
    {
        private readonly IWebHostEnvironment webHostEnvironment;

        public Startup(IWebHostEnvironment env)
        {
            this.webHostEnvironment = env;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers(options => { options.Filters.Add(typeof(ApiExceptionFilter)); });

            services.AddCors("CorsPolicy");

            services.AddSingleton<IFileProvider>(this.webHostEnvironment.ContentRootFileProvider);
            services.AddSingleton<IAzureIPInfoProvider, AzureIPInfoProvider>();
            services.AddSingleton<ILegacyAzureIPInfoProvider, LegacyAzureIPInfoProvider>(serviceProvider =>
            {
                var localDataStoreContext = new LegacyAzureIPInfoProvider(webHostEnvironment.ContentRootPath);
                return localDataStoreContext;
            });
            services.AddSingleton<StorageAccountsContext>(serviceProvider =>
            {
                var localDataStoreContext = new StorageAccountsContext(webHostEnvironment.ContentRootPath);
                return localDataStoreContext;
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseCors("CorsPolicy");
            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            app.UseStaticFiles();
        }
    }
}
