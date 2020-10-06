using Newtonsoft.Json;

namespace AzureSpeed.WebApp.Contracts
{
    public class UIError
    {
        [JsonProperty("message")]
        public string Message { get; set; }
    }
}
