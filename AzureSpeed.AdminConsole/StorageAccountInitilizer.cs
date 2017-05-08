using System;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using AzureSpeed.Common.LocalData;
using AzureSpeed.Common.Storage;

namespace AzureSpeed.AdminConsole
{
    internal class StorageAccountInitilizer
    {
        public async Task InitializeAsync()
        {
            var localDataStoreContext = new LocalDataStoreContext(
                Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location),
                ConfigurationManager.AppSettings["AzureIpRangeFileList"],
                ConfigurationManager.AppSettings["AwsIpRangeFile"],
                ConfigurationManager.AppSettings["AliCloudIpRangeFile"]);

            foreach (var account in localDataStoreContext.StorageAccounts.ToList())
            {
                if (account.Name != "azspdkoreasouth")
                {
                    continue;
                }

                var storageContext = new StorageContext(account);

                Console.WriteLine($"[{account.Name}] About to initialize stroage account ");

                await storageContext.EnableLoggingAsync();
                Console.WriteLine($"[{account.Name}] Enable logging completed succesfully");

                await storageContext.EnableCORSAsync();
                Console.WriteLine($"[{account.Name}] Enable CORS completed");

                await storageContext.CreatePublicContainerAsync();
                Console.WriteLine($"[{account.Name}] Create public container completed");

                await storageContext.CreatePrivateContainerAsync();
                Console.WriteLine($"[{account.Name}] Create private container completed");

                await storageContext.Upload100MBBlobAsync();
                Console.WriteLine($"[{account.Name}] Upload 100MB.bin blob completed");

                Console.WriteLine($"[{account.Name}] Storage account is initilized successfully");
            }

            Console.WriteLine("All storage accounts are initialized successfully");
        }
    }
}
