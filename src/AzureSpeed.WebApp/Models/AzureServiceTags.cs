using Newtonsoft.Json;

namespace AzureSpeed.WebApp.Models
{
    public partial class AzureServiceTagsCollection
    {
        [JsonProperty("changeNumber")]
        public long ChangeNumber { get; set; }

        [JsonProperty("cloud")]
        public string Cloud { get; set; }

        [JsonProperty("values")]
        public AzureServiceTag[] AzureServiceTags { get; set; }
    }

    public partial class AzureServiceTag
    {
        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("properties")]
        public AzureServiceTagProperties Properties { get; set; }
    }

    public partial class AzureServiceTagProperties
    {
        [JsonProperty("changeNumber")]
        public long ChangeNumber { get; set; }

        [JsonProperty("region")]
        public string Region { get; set; }

        [JsonProperty("platform")]
        public string Platform { get; set; }

        [JsonProperty("systemService")]
        public string SystemService { get; set; }

        [JsonProperty("addressPrefixes")]
        public string[] AddressPrefixes { get; set; }
    }
}