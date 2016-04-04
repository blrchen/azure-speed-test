namespace AzureSpeed.AdminConsole
{
    using System.Threading.Tasks;
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

                _logger.Info($"[{account.Name}] Initialize account ");

                storageContext.EnableLogging();
                _logger.Info($"[{account.Name}] Enabling logging completed");

                storageContext.EnableCORS();
                _logger.Info($"[{account.Name}] Enabling CORS completed");

                await storageContext.CreatePublicContainerAsync();
                _logger.Info($"[{account.Name}] Creating public container completed");

                await storageContext.CreatePrivateContainerAsync();
                _logger.Info($"[{account.Name}] Creating private container completed");

                await storageContext.Upload100MBBlobAsync();
                _logger.Info($"[{account.Name}] Uploading 100MB.bin blob completed");

                _logger.Info($"[{account.Name}] Storage account is initilized successfully");
            }
        }
    }
}

