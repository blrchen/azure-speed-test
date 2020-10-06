using Newtonsoft.Json;

namespace AzureSpeed.WebApp.Storage
{
    public class StorageAccount
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("key")]
        public string Key { get; set; }

        [JsonProperty("locationId")]
        public string LocationId { get; set; }

        [JsonProperty("endpointSuffix")]
        public string EndpointSuffix { get; set; }
    }
}