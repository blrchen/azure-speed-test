using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using AzureSpeed.ApiService.Contracts;
using AzureSpeed.ApiService.Models;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace AzureSpeed.ApiService.Providers
{
    public class AzureIPInfoProvider : IAzureIPInfoProvider
    {
        private readonly HttpClient httpClient;
        private readonly ILogger<AzureIPInfoProvider> logger;

        public AzureIPInfoProvider(ILogger<AzureIPInfoProvider> logger)
        {
            this.httpClient = new HttpClient();
            this.logger = logger;
        }

        public async Task<AzureIPInfo> GetAzureIPInfo(string ipAddressOrUrl)
        {
            logger.LogInformation($"Invoke GetAzureIPInfo for {ipAddressOrUrl}");

            string ipAddress = Utils.Utils.ConvertToIPAddress(ipAddressOrUrl);
            var azureIPInfoList = await GetAzureIPInfoList();

            foreach (var azureIPInfo in azureIPInfoList)
            {
                IPNetwork ipNetwork = IPNetwork.Parse(azureIPInfo.IPAddressPrefix);

                if (ipNetwork.Contains(IPAddress.Parse(ipAddress)))
                {
                    azureIPInfo.IPAddress = ipAddress;
                    return azureIPInfo;
                }
            }

            logger.LogInformation($"{ipAddress} is not a known Azure ip address");

            return new AzureIPInfo();
        }

        private async Task<List<AzureIPInfo>> GetAzureIPInfoList()
        {
            List<AzureIPInfo> azureIPInfoList = new List<AzureIPInfo>();
            var clouds = Enum.GetValues(typeof(AzureCloudName));
            foreach (var cloud in clouds)
            {
                string ipFileBlobUrl = $"https://azureiplookup.blob.core.windows.net/ipfiles/{cloud}.json";
                this.logger.LogInformation($"Getting Azure ip info for {cloud} from {ipFileBlobUrl}");
                string jsonResponseMessage = await httpClient.GetStringAsync(ipFileBlobUrl);
                var azureServiceTagsCollection = JsonConvert.DeserializeObject<AzureServiceTagsCollection>(jsonResponseMessage);

                foreach (var azureServiceTag in azureServiceTagsCollection.AzureServiceTags)
                {
                    if (string.IsNullOrWhiteSpace(azureServiceTag.Properties.Region))
                    {
                        continue;
                    }

                    foreach (string addressPrefix in azureServiceTag.Properties.AddressPrefixes)
                    {
                        azureIPInfoList.Add(new AzureIPInfo
                        {
                            ServiceTagId = azureServiceTag.Id,
                            Region = azureServiceTag.Properties.Region,

                            // Platform = azureServiceTag.Properties.Platform, // Platform is always Azure
                            SystemService = azureServiceTag.Properties.SystemService,
                            IPAddressPrefix = addressPrefix
                        });
                    }
                }
            }

            return azureIPInfoList;
        }
    }
}
