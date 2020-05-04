using AzureSpeed.ApiService.Extensions;
using AzureSpeed.ApiService.Filters;
using AzureSpeed.ApiService.Providers;
using AzureSpeed.ApiService.Storage;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace AzureSpeed.WebApp
{
    public class Startup
    {
        private readonly IWebHostEnvironment webHostEnvironment;

        public Startup(IConfiguration configuration, IWebHostEnvironment webHostEnvironment)
        {
            Configuration = configuration;
            this.webHostEnvironment = webHostEnvironment;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllers(options => { options.Filters.Add(typeof(ApiExceptionFilter)); });

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist";
            });

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

            app.UseStaticFiles();
            if (!env.IsDevelopment())
            {
                app.UseSpaStaticFiles();
            }

            app.UseCors("CorsPolicy");
            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller}/{action=Index}/{id?}");
            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501
                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
                else
                {
                    spa.Options.DefaultPage = "/AzureSpeedFrontend/index.html";
                }
            });
        }
    }
}
