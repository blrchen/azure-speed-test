namespace AzureSpeed.ApiService.Contracts
{
    public class AzureIPInfo
    {
        public string ServiceTagId { get; set; }

        // public string ServiceTagName { get; set; }
        public string IPAddress { get; set; }
        public string IPAddressPrefix { get; set; }
        public string Region { get; set; }

        // public string Platform { get; set; }
        public string SystemService { get; set; }
    }
}
