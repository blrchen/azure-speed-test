using System.Text.Json.Serialization;

namespace AzureSpeed.WebApp
{
    public class StorageAccount
    {
        [JsonPropertyName("prefix")]
        public required string Prefix { get; init; }

        [JsonPropertyName("trafficWeight")]
        public required int TrafficWeight { get; init; }

        [JsonPropertyName("name")]
        public required string Name { get; init; }

        [JsonPropertyName("key")]
        public required string Key { get; init; }
    }

    public class Settings
    {
        [JsonPropertyName("regions")]
        public Dictionary<string, List<StorageAccount>> Regions { get; init; } = [];
    }
}
