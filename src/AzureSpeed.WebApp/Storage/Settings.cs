using System.Collections.Generic;

namespace AzureSpeed.WebApp.Storage
{
    public class Settings
    {
        public IEnumerable<StorageAccount> Accounts { get; set; }
    }
}