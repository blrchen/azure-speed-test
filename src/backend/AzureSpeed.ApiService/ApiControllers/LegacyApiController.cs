using System.IO;
using AzureSpeed.Common.LocalData;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;

namespace AzureSpeed.ApiService.ApiControllers
{
    // TODO: CLEAN UP
    [Route("api")]
    public class LegacyApiController : Controller
    {
        private readonly IFileProvider fileProvider;
        private readonly ILogger<LegacyApiController> logger;
        private readonly LocalDataStoreContext localDataStoreContext;

        public LegacyApiController(
            IFileProvider fileProvider,
            ILogger<LegacyApiController> logger,
            IWebHostEnvironment webHostEnvironment)
        {
            this.fileProvider = fileProvider;
            this.logger = logger;
            this.localDataStoreContext = new LocalDataStoreContext(webHostEnvironment.ContentRootPath);
        }

        [HttpGet]
        [Route("region")]
        public IActionResult GetAzureInfo(string ipOrUrl)
        {
            logger.LogInformation($"Get region info for {ipOrUrl}");
            var result = this.localDataStoreContext.GetRegionInfo(ipOrUrl);
            return Ok(result);
        }

        [HttpGet]
        [Route("iprange")]
        public IActionResult GetIpRange()
        {
            var result = this.localDataStoreContext.GetIpRange();
            return Ok(result);
        }

        [HttpGet]
        [Route("billingmeters")]
        public IActionResult GetBillingMeters()
        {
            var file = fileProvider.GetFileInfo("Data/ratecard.json");
            string result;
            using (var stream = file.CreateReadStream())
            {
                using (var reader = new StreamReader(stream))
                {
                    result = reader.ReadToEnd();
                }
            }

            return Ok(result);
        }

        [HttpGet]
        [Route("vmslugs")]
        public IActionResult GetAzureVMSlugs()
        {
            var file = fileProvider.GetFileInfo("Data/vmslugs.json");
            string result;
            using (var stream = file.CreateReadStream())
            {
                using (var reader = new StreamReader(stream))
                {
                    result = reader.ReadToEnd();
                }
            }

            return Ok(result);
        }
    }
}