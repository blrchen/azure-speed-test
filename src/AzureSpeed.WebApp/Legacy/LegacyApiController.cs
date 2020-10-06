using AzureSpeed.WebApp.Providers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace AzureSpeed.WebApp.Legacy
{
    // TODO: Deprecate this api
    [Route("api")]
    [ApiController]
    public class LegacyApiController : ControllerBase
    {
        private readonly ILegacyAzureIPInfoProvider legacyAzureIpInfoProvider;
        private readonly ILogger<LegacyApiController> logger;

        public LegacyApiController(
            ILogger<LegacyApiController> logger,
            ILegacyAzureIPInfoProvider legacyAzureIpInfoProvider)
        {
            this.legacyAzureIpInfoProvider = legacyAzureIpInfoProvider;
            this.logger = logger;
        }

        [HttpGet]
        [Route("region")]
        public IActionResult GetAzureInfo(string ipOrUrl)
        {
            var result = this.legacyAzureIpInfoProvider.GetRegionInfo(ipOrUrl);
            logger.LogInformation($"Get region info for {ipOrUrl}, result = {JsonConvert.SerializeObject(result)}");
            return Ok(result);
        }
    }
}