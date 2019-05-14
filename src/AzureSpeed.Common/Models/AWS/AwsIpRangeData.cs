using Newtonsoft.Json;
using System.Collections.Generic;

namespace AzureSpeed.Common.Models.AWS
{
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
