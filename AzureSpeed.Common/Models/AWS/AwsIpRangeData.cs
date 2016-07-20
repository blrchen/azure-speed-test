namespace AzureSpeed.Common.Models
{
    using System.Collections.Generic;
    using Newtonsoft.Json;

    public class AwsIpRangeData
    {
        [JsonProperty("syncToken")]
        public string SyncToken { get; set; }

        [JsonProperty("createDate")]
        public string CreateDate { get; set; }

        [JsonProperty("prefixes")]
        public List<Prefix> Prefixes { get; set; }
    }
}
