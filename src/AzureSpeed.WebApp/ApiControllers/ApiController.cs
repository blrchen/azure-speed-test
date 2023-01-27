using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using AzureSpeed.WebApp.Storage;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace AzureSpeed.WebApp.ApiControllers
{
    [Route("api")]
    [ApiController]
    public class ApiController : ControllerBase
    {
        private readonly ILogger<ApiController> logger;
        private readonly IHttpClientFactory httpClientFactory;
        private readonly StorageAccountsProvider storageAccountsProvider;

        public ApiController(
            ILogger<ApiController> logger,
            IHttpClientFactory httpClientFactory,
            StorageAccountsProvider storageAccountsProvider)
        {
            this.logger = logger;
            this.httpClientFactory = httpClientFactory;
            this.storageAccountsProvider = storageAccountsProvider;
        }

        [HttpGet]
        [Route("ipinfo")]
#pragma warning disable CA1054 // URI-like parameters should not be strings
        public async Task<IActionResult> GetAzureIpInfo(string ipAddressOrUrl)
#pragma warning restore CA1054 // URI-like parameters should not be strings
        {
            logger.LogInformation($"GetAzureIPInfo ipAddressOrUrl = {ipAddressOrUrl}");
            if (string.IsNullOrEmpty(ipAddressOrUrl))
            {
                return BadRequest("Query string ipAddressOrUrl can not be null");
            }

            string url = $"https://azureiplookup.azurewebsites.net/api/ipinfo?ipOrDomain={ipAddressOrUrl}";
            var uri = new Uri(url);
#pragma warning disable CA2000 // Dispose objects before losing scope
            string result = await this.httpClientFactory.CreateClient().GetStringAsync(uri);
#pragma warning restore CA2000 // Dispose objects before losing scope
            return Ok(result);
        }

        [HttpGet]
        [Route("sas")]
        public IActionResult GetSasLink(string regionName, string blobName, string operation)
        {
            logger.LogInformation($"GetSasLink regionName = {regionName}, blobName = {blobName}, operation = {operation}");
            if (string.IsNullOrEmpty(regionName))
            {
                return BadRequest("Query string regionName can not be null");
            }

            if (string.IsNullOrEmpty(blobName))
            {
                return BadRequest("Query string blobName can not be null");
            }

            if (string.IsNullOrEmpty(operation))
            {
                return BadRequest("Query string operation can not be null");
            }

            var account = storageAccountsProvider.StorageAccounts.FirstOrDefault(_ => _.LocationId == regionName);
            if (account == null)
            {
                return BadRequest($"Region {regionName} is not supported");
            }

            var blobProvider = new BlobProvider(account);
            string url = blobProvider.GetSasUrl(blobName, operation).ToString();
            return Ok(new { Url = url });
        }
    }
}
