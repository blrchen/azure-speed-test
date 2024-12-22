using Newtonsoft.Json;
using System.Collections.ObjectModel;

namespace AzureSpeed.WebApp
{
    // ChatGPT models
    public class ChatCompletionRequest
    {
        public string AccessToken { get; set; }
        public string SystemPromptId { get; set; }
        public string SystemPrompt { get; set; }
        public string UserContent { get; set; }
        public string ResponseLanguage { get; set; }
        public string ProgramLanguage { get; set; }
    }
    public class ChatCompletionResponse
    {
        [JsonProperty("id")]
        public string Id { get; set; }

        [JsonProperty("created")]
        public int Created { get; set; }

        [JsonProperty("model")]
        public string Model { get; set; }

        [JsonProperty("choices")]
        public Collection<Choice> Choices { get; set; }

        [JsonProperty("usage")]
        public Usage Usage { get; set; }
    }
    public class Choice
    {
        [JsonProperty("index")]
        public int Index { get; set; }

        [JsonProperty("finish_reason")]
        public string FinishReason { get; set; }

        [JsonProperty("message")]
        public Message Message { get; set; }
    }
    public class Usage
    {
        [JsonProperty("completion_tokens")]
        public int CompletionTokens { get; set; }

        [JsonProperty("prompt_tokens")]
        public int PromptTokens { get; set; }

        [JsonProperty("total_tokens")]
        public int TotalTokens { get; set; }
    }
    public class Message
    {
        [JsonProperty("role")]
        public string Role { get; set; }

        [JsonProperty("content")]
        public string Content { get; set; }
    }

    // AzureSpeed models
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

    public class Settings
    {
        public IEnumerable<StorageAccount> Accounts { get; set; }
    }
}
