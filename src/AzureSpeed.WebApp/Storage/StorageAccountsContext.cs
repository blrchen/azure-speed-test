using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace AzureSpeed.WebApp.Storage
{
    public class StorageAccountsContext
    {
        private readonly string dataFilePath;
        private IEnumerable<StorageAccount> accounts;

        public StorageAccountsContext(string dataPath)
        {
            this.dataFilePath = dataPath;
        }

        public IEnumerable<StorageAccount> StorageAccounts
        {
            get
            {
                if (this.accounts == null)
                {
                    string filePath = Path.Combine(dataFilePath, @"Data\settings.json");
                    var text = File.ReadAllText(filePath);
                    var setting = JsonConvert.DeserializeObject<Settings>(text);
                    this.accounts = setting.Accounts;
                }

                return this.accounts;
            }
        }
    }
}