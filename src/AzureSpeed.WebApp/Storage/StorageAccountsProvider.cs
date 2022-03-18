using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace AzureSpeed.WebApp.Storage
{
    public class StorageAccountsProvider
    {
        private readonly string dataFilePath;
        private IEnumerable<StorageAccount> accounts;

        public StorageAccountsProvider(string dataPath)
        {
            this.dataFilePath = dataPath;
        }

        public IEnumerable<StorageAccount> StorageAccounts
        {
            get
            {
                if (this.accounts != null)
                {
                    return this.accounts;
                }

                string filePath = Path.Combine(dataFilePath, @"Data\settings.json");
                var text = File.ReadAllText(filePath);
                var setting = JsonConvert.DeserializeObject<Settings>(text);
                this.accounts = setting.Accounts;

                return this.accounts;
            }
        }
    }
}