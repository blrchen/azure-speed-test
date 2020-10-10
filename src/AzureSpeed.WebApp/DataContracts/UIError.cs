using Newtonsoft.Json;

namespace AzureSpeed.WebApp.DataContracts
{
    public class UIError
    {
        [JsonProperty("message")]
        public string Message { get; set; }
    }
}
