namespace AzureSpeed.AdminConsole
{
    using System;
    using System.Threading.Tasks;
    using Common;
    using NLog;
    using WebUI;
    using WebUI.Common;

    internal class StorageAccountInitilizer
    {
        private readonly Logger logger = LogManager.GetCurrentClassLogger();

        public async Task InitializeAsync()
        {
            foreach (var account in AzureSpeedData.Accounts)
            {
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
