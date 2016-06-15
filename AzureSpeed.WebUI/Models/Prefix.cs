using Newtonsoft.Json;

namespace AzureSpeed.WebUI.Models
{
    public class Prefix
    {
        [JsonProperty("ip_prefix")]
        public string IpPrefix { get; set; }

        [JsonProperty("region")]
        public string Region { get; set; }

        [JsonProperty("service")]
        public string Service { get; set; }
    }
}