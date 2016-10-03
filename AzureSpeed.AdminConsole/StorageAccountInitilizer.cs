using System.Configuration;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using AzureSpeed.Common.LocalData;
using AzureSpeed.Common.Storage;
using NLog;

namespace AzureSpeed.AdminConsole
{
    internal class StorageAccountInitilizer
    {
        private readonly Logger logger = LogManager.GetCurrentClassLogger();

        public async Task InitializeAsync()
        {
            var localDataStoreContext = new LocalDataStoreContext(
                Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location),
                ConfigurationManager.AppSettings["AzureIpRangeFileList"],
                ConfigurationManager.AppSettings["AwsIpRangeFile"],
                ConfigurationManager.AppSettings["AliCloudIpRangeFile"]);

            foreach (var account in localDataStoreContext.StorageAccounts.ToList())
            {
                if (account.Name != "azspdwestus2")
                {
                    continue;
                }

                var storageContext = new StorageContext(account);

                logger.Info($"[{account.Name}] About to initialize stroage account ");

                await storageContext.EnableLoggingAsync();
                logger.Info($"[{account.Name}] Enable logging completed succesfully");

                await storageContext.EnableCORSAsync();
                logger.Info($"[{account.Name}] Enable CORS completed");

                await storageContext.CreatePublicContainerAsync();
                logger.Info($"[{account.Name}] Create public container completed");

                await storageContext.CreatePrivateContainerAsync();
                logger.Info($"[{account.Name}] Create private container completed");

                await storageContext.Upload100MBBlobAsync();
                logger.Info($"[{account.Name}] Upload 100MB.bin blob completed");

                logger.Info($"[{account.Name}] Storage account is initilized successfully");
            }

            logger.Info("All storage accounts are initialized successfully");
        }
    }
}
