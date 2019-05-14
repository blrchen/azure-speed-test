using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Microsoft.WindowsAzure.Storage.Blob;
using Microsoft.WindowsAzure.Storage.Shared.Protocol;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;

namespace AzureSpeed.Common.Storage
{
    public class StorageContext
    {
        private readonly CloudBlobClient blobClient;

        public StorageContext(StorageAccount account)
        {
            // todo: change to environment
            string endpointSuffix = string.IsNullOrEmpty(account.EndpointSuffix)
                ? "core.windows.net"
                : account.EndpointSuffix;

            var storageCredentials = new StorageCredentials(account.Name, account.Key);
            var storageAccount = new CloudStorageAccount(storageCredentials, endpointSuffix, true);
            this.blobClient = storageAccount.CreateCloudBlobClient();
        }

        public string GetSasUrl(string blobName, string operation)
        {
            string containerName = string.Empty;
            var permissions = SharedAccessBlobPermissions.None;
            if (operation.ToLower() == "upload")
            {
                permissions |= SharedAccessBlobPermissions.Write;
                containerName = AzureSpeedConstants.UploadContainerName;
            }

            if (operation.ToLower() == "download")
            {
                permissions |= SharedAccessBlobPermissions.Read;
                containerName = AzureSpeedConstants.PrivateContainerName;
            }

            var policy = new SharedAccessBlobPolicy
            {
                SharedAccessExpiryTime = DateTime.Now.AddMinutes(2),
                Permissions = permissions
            };

            var container = this.blobClient.GetContainerReference(containerName);
            var blob = container.GetBlobReference(blobName);
            string blobToken = blob.GetSharedAccessSignature(policy);
            return $"{blob.Uri}{blobToken}";
        }

        public async Task EnableCORSAsync()
        {
            CorsHttpMethods allowedMethods = CorsHttpMethods.None;
            allowedMethods |= CorsHttpMethods.Get;
            allowedMethods |= CorsHttpMethods.Put;
            allowedMethods |= CorsHttpMethods.Post;
            allowedMethods |= CorsHttpMethods.Delete;
            allowedMethods |= CorsHttpMethods.Options;

            var delimiter = new[] { "," };
            var corsRule = new CorsRule();
            const string AllowedOrigins = "*";
            const string AllowedHeaders = "*";
            const string ExposedHeaders = "";

            var allAllowedOrigin = AllowedOrigins.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);
            var allExpHeaders = ExposedHeaders.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);
            var allAllowHeaders = AllowedHeaders.Split(delimiter, StringSplitOptions.RemoveEmptyEntries);

            var corsAllowedOrigin = new List<string>();
            foreach (var item in allAllowedOrigin)
            {
                if (!string.IsNullOrWhiteSpace(item))
                {
                    corsAllowedOrigin.Add(item.Trim());
                }
            }

            var corsExposedHeaders = new List<string>();
            foreach (var item in allExpHeaders)
            {
                if (!string.IsNullOrWhiteSpace(item))
                {
                    corsExposedHeaders.Add(item.Trim());
                }
            }

            var corsAllowHeaders = new List<string>();
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
            var serviceProperties = await this.blobClient.GetServicePropertiesAsync();
            serviceProperties.Cors.CorsRules.Clear();
            serviceProperties.Cors.CorsRules.Add(corsRule);
            await this.blobClient.SetServicePropertiesAsync(serviceProperties);
        }

        public async Task EnableLoggingAsync()
        {
            var serviceProperties = await this.blobClient.GetServicePropertiesAsync();
            serviceProperties.Logging.LoggingOperations = LoggingOperations.All;
            serviceProperties.Logging.RetentionDays = 7;
            await this.blobClient.SetServicePropertiesAsync(serviceProperties);
        }

        public async Task CreatePublicContainerAsync()
        {
            var container = this.blobClient.GetContainerReference(AzureSpeedConstants.PublicContainerName);
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
                var blob = container.GetBlockBlobReference(AzureSpeedConstants.CallBackBlobName);
                if (blob != null && !await blob.ExistsAsync())
                {
                    await CreateCallbackJsBlob();
                }
            }
        }

        public async Task CreatePrivateContainerAsync(string containerName)
        {
            var container = this.blobClient.GetContainerReference(containerName);
            if (container != null)
            {
                // Create private container with no public access permission
                await container.CreateIfNotExistsAsync();
                var permissions = new BlobContainerPermissions
                {
                    PublicAccess = BlobContainerPublicAccessType.Off
                };
                await container.SetPermissionsAsync(permissions);
            }
        }

        public async Task CreateCallbackJsBlob()
        {
            var container = this.blobClient.GetContainerReference(AzureSpeedConstants.PublicContainerName);
            string blobContent = $"latency._pingCallback('{blobClient.Credentials.AccountName}');";
            using (var stream = GenerateStreamFromString(blobContent))
            {
                var blob = container.GetBlockBlobReference(AzureSpeedConstants.CallBackBlobName);
                await blob.UploadFromStreamAsync(stream);
                blob.Properties.ContentType = "application/javascript";
                await blob.SetPropertiesAsync();
            }
        }

        public async Task Upload100MBBlobAsync()
        {
            var container = this.blobClient.GetContainerReference(AzureSpeedConstants.PrivateContainerName);

            // Create 100MB.bin blob
            var blob = container.GetBlockBlobReference(AzureSpeedConstants.DownloadTestBlobName);
            if (blob != null && !await blob.ExistsAsync())
            {
                var fullFilePath = @"C:\DelMe\100MB.bin";
                using (var fileStream = File.OpenRead(fullFilePath))
                {
                    await blob.UploadFromStreamAsync(fileStream);
                }
            }
        }

        private MemoryStream GenerateStreamFromString(string s)
        {
            return new MemoryStream(Encoding.UTF8.GetBytes(s ?? string.Empty));
        }
    }
}