using AzureSpeed.Common;
using AzureSpeed.Common.LocalData;
using AzureSpeed.Common.Storage;
using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;

namespace AzureSpeed.AdminConsole
{
    internal class StorageAccountInitializer
    {
        public async Task InitializeAsync()
        {
            var localDataStoreContext = new LocalDataStoreContext(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location));

            foreach (var account in localDataStoreContext.StorageAccounts.ToList())
            {
                if (account.Name != "astnorwayeast")
                {
                    continue;
                }

                var storageContext = new StorageContext(account);

                Console.WriteLine($"[{account.Name}] Starting configure storage account");

                await storageContext.EnableLoggingAsync();
                Console.WriteLine($"[{account.Name}] Enable logging completed successfully");

                await storageContext.EnableCORSAsync();
                Console.WriteLine($"[{account.Name}] Successfully enabled CORS");

                await storageContext.CreatePublicContainerAsync();
                Console.WriteLine($"[{account.Name}] Successfully created public container");

                await storageContext.CreatePrivateContainerAsync(AzureSpeedConstants.PrivateContainerName);
                Console.WriteLine($"[{account.Name}] Successfully created private container");

                await storageContext.CreatePrivateContainerAsync(AzureSpeedConstants.UploadContainerName);
                Console.WriteLine($"[{account.Name}] Successfully created upload container");

                await storageContext.Upload100MBBlobAsync();
                Console.WriteLine($"[{account.Name}] Successfully uploaded 100MB.bin blob");

                Console.WriteLine($"[{account.Name}] Successfully initialized storage account");
            }

            Console.WriteLine("Successfully completed all storage accounts configuration");
        }
    }
}
