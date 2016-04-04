namespace AzureSpeed.AdminCommand
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.WindowsAzure.Storage;
    using Microsoft.WindowsAzure.Storage.Blob;
    using Microsoft.WindowsAzure.Storage.Shared.Protocol;
    using NLog;
    using WebUI.Models;
    using Constants = WebUI.Models.Constants;

    // This tool is for azurespeed admin operations. It setups everythings needed for a storage to run speed test.
    // 1. Enable CORS
    // 2. Create a container azurespeed
    // 2. Create a callback.js which is used by latency test
    // 3. Upload a 100 mb dummy file for download speed test.

    internal class Program
    {
        private static void Main()
        {
            Worker worker = new Worker();
            worker.InitStorageAsync().Wait();
            Console.ReadLine();
        }
    }

    internal class Worker
    {
        private readonly Logger _logger = LogManager.GetCurrentClassLogger();

        public async Task InitStorageAsync()
        {
            foreach (var account in AzureSpeedData.Accounts)
            {
                CloudStorageAccount storageAccount;
                if (!TryParse(account, out storageAccount))
                {
                    _logger.Error("Account invalid");
                    continue;
                }

                var blobClient = storageAccount.CreateCloudBlobClient();

                EnableStorageLogging(blobClient);
                _logger.Info("Enabling storage logging successfully for account {0}", account.Name);

                EnableCors(blobClient);
                _logger.Info("Enabling CORS for account {0} successfully", account.Name);

                await CreatePublicContainerAsync(account, blobClient);
                _logger.Info("Creating public container completes");

                await CreatePrivateContainerAsync(blobClient);
                _logger.Info("Creating private container completes");

                _logger.Info("Storage account {0} successfully initilized completes", account.Name);
            }
        }

        private static void EnableStorageLogging(CloudBlobClient blobClient)
        {
            var serviceProperties = blobClient.GetServiceProperties();
            serviceProperties.Logging.LoggingOperations = LoggingOperations.All;
            serviceProperties.Logging.RetentionDays = 365;
            blobClient.SetServiceProperties(serviceProperties);
        }

        private void EnableCors(CloudBlobClient blobClient)
        {
            try
            {
                CorsHttpMethods allowedMethods = CorsHttpMethods.None;
                allowedMethods = allowedMethods | CorsHttpMethods.Get;
                allowedMethods = allowedMethods | CorsHttpMethods.Put;
                allowedMethods = allowedMethods | CorsHttpMethods.Post;
                allowedMethods = allowedMethods | CorsHttpMethods.Delete;
                allowedMethods = allowedMethods | CorsHttpMethods.Options;

                var delimiter = new[] { "," };
                CorsRule corsRule = new CorsRule();
                const string allowedOrigins = "*";
                const string allowedHeaders = "*";
                const string exposedHeaders = "";

                string[] allAllowedOrigin = allowedOrigins.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);
                string[] allExpHeaders = exposedHeaders.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);
                string[] allAllowHeaders = allowedHeaders.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);

                List<string> corsAllowedOrigin = new List<string>();
                foreach (var item in allAllowedOrigin)
                {
                    if (!string.IsNullOrWhiteSpace(item))
                    {
                        corsAllowedOrigin.Add(item.Trim());
                    }
                }
                List<string> corsExposedHeaders = new List<string>();
                foreach (var item in allExpHeaders)
                {
                    if (!string.IsNullOrWhiteSpace(item))
                    {
                        corsExposedHeaders.Add(item.Trim());
                    }
                }
                List<string> corsAllowHeaders = new List<string>();
                foreach (var item in allAllowHeaders)
                {
                    if (!string.IsNullOrWhiteSpace(item))
                    {
                        corsAllowHeaders.Add(item.Trim());
                    }
                }
                corsRule.MaxAgeInSeconds = 200;
                corsRule.AllowedMethods = allowedMethods;
                corsRule.AllowedHeaders = corsAllowHeaders;
                corsRule.AllowedOrigins = corsAllowedOrigin;
                corsRule.ExposedHeaders = corsExposedHeaders;
                ServiceProperties properties = blobClient.GetServiceProperties();
                properties.Cors.CorsRules.Clear();
                properties.Cors.CorsRules.Add(corsRule);
                blobClient.SetServiceProperties(properties);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error enable CORS");
            }
        }

        private async Task CreatePublicContainerAsync(Account account, CloudBlobClient blobClient)
        {
            var container = blobClient.GetContainerReference(Constants.PublicContainerName);
            if (container != null)
            {
                // Create container with blob public access permission
                await container.CreateIfNotExistsAsync();
                var permissions = new BlobContainerPermissions
                {
                    PublicAccess = BlobContainerPublicAccessType.Blob
                };
                await container.SetPermissionsAsync(permissions);

                // Create callback.js blob
                var blob = container.GetBlockBlobReference("callback.js");
                if (blob != null && !blob.Exists())
                {
                    await CreateCallbackJSBlob(account, blob);
                    _logger.Info("Uploading callback.js blob completes");
                }

                // Post validation
                if (!blob.Uri.ToString().Contains(account.Region.Replace(" ", "").ToLower()))
                {
                    _logger.Error("Storage account {0} has wrong region {1}", account.Name, account.Region);
                }
            }
        }

        private async Task CreatePrivateContainerAsync(CloudBlobClient blobClient)
        {
            var container = blobClient.GetContainerReference(Constants.PrivateContainerName);
            if (container != null)
            {
                // Create private container with no puublic access permission
                await container.CreateIfNotExistsAsync();
                var permissions = new BlobContainerPermissions
                {
                    PublicAccess = BlobContainerPublicAccessType.Off
                };
                await container.SetPermissionsAsync(permissions);

                // Create 100MB.bin blob
                //var blob = container.GetBlockBlobReference("100MB.bin");
                //if (blob != null && !blob.Exists())
                //{
                //    var fullFilePath = @"C:\DelMe\100MB.bin";
                //    using (var fileStream = File.OpenRead(fullFilePath))
                //    {
                //        await blob.UploadFromStreamAsync(fileStream);
                //    }
                //    _logger.Info("Uploading 100MB.bin blob completes");
                //}
            }
        }

        private async Task CreateCallbackJSBlob(Account account, CloudBlockBlob blob)
        {
            string callback = string.Format(@"latency._pingCallback('{0}');", account.Name);
            Stream stream = GenerateStreamFromString(callback);
            blob.UploadFromStream(stream);
            blob.Properties.ContentType = "application/javascript";
            await blob.SetPropertiesAsync();
        }

        private MemoryStream GenerateStreamFromString(string s)
        {
            return new MemoryStream(Encoding.UTF8.GetBytes(s ?? ""));
        }

        private bool TryParse(Account account, out CloudStorageAccount storageAccount)
        {
            string endpoint = string.IsNullOrEmpty(account.EndpointSuffix)
                ? ""
                : string.Format("BlobEndpoint=https://{0}.blob.{1}/;", account.Name, account.EndpointSuffix);
            string connectionString = string.Format(
                "{0}DefaultEndpointsProtocol=https;AccountName={1};AccountKey={2}",
                endpoint, account.Name, account.Key);
            // todo: TryParse does not validate if account is valid or not.
            return CloudStorageAccount.TryParse(connectionString, out storageAccount);
        }
    }
}