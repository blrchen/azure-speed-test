namespace AzureSpeed.AdminConsole
{
    using System.Threading.Tasks;
    using Common;
    using NLog;
    using WebUI;

    internal class StorageAccountInitilizer
    {
        private readonly Logger _logger = LogManager.GetCurrentClassLogger();

        public async Task InitializeAsync()
        {
            foreach (var account in AzureSpeedData.Accounts)
            {
                var storageContext = new StorageContext(account);

                _logger.Info($"[{account.Name}] About to initialize stroage account ");

                storageContext.EnableLogging();
                _logger.Info($"[{account.Name}] Enable logging completed succesfully");

                storageContext.EnableCORS();
                _logger.Info($"[{account.Name}] Enable CORS completed");

                await storageContext.CreatePublicContainerAsync();
                _logger.Info($"[{account.Name}] Create public container completed");

                await storageContext.CreatePrivateContainerAsync();
                _logger.Info($"[{account.Name}] Create private container completed");

                await storageContext.Upload100MBBlobAsync();
                _logger.Info($"[{account.Name}] Upload 100MB.bin blob completed");

                _logger.Info($"[{account.Name}] Storage account is initilized successfully");
            }
        }
    }
}

