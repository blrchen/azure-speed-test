namespace AzureSpeed.WebUI
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Text;
    using System.Threading.Tasks;
    using Microsoft.WindowsAzure.Storage;
    using Microsoft.WindowsAzure.Storage.Auth;
    using Microsoft.WindowsAzure.Storage.Blob;
    using Microsoft.WindowsAzure.Storage.Shared.Protocol;

    public class StorageContext
    {
        private readonly CloudBlobClient blobClient;

        public StorageContext(AzureSpeedStorageAccount account)
        {
            // todo: change to environment
            string endpointSuffix = string.IsNullOrEmpty(account.EndpointSuffix)
                ? "core.windows.net"
                : account.EndpointSuffix;

            var storageAccount = new CloudStorageAccount(new StorageCredentials(account.Name, account.Key),
                endpointSuffix, true);
            blobClient = storageAccount.CreateCloudBlobClient();
        }

        public string GetSasUrl(string blobName, string operation)
        {
            var permissions = SharedAccessBlobPermissions.None;
            if (operation.ToLower() == "upload")
            {
                permissions |= SharedAccessBlobPermissions.Write;
            }
            if (operation.ToLower() == "download")
            {
                permissions |= SharedAccessBlobPermissions.Read;
            }

            var policy = new SharedAccessBlobPolicy
            {
                SharedAccessExpiryTime = DateTime.Now.AddMinutes(2),
                Permissions = permissions
            };
            var container = blobClient.GetContainerReference(AzureSpeedConstants.PrivateContainerName);
            var blob = container.GetBlobReference(blobName);
            string blobToken = blob.GetSharedAccessSignature(policy);
            return $"{blob.Uri}{blobToken}";
        }

        public void EnableCORS()
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

        public void CleanUpBlobs()
        {
            var container = blobClient.GetContainerReference(AzureSpeedConstants.PrivateContainerName);
            var blobs = container.ListBlobs();
            var oneMonthAgo = DateTimeOffset.Now.AddMonths(-1);
            foreach (IListBlobItem blob in blobs)
            {
                var cblob = blob as ICloudBlob;
                if (cblob != null && cblob.Name != AzureSpeedConstants.CallBackBlobName && cblob.Name != AzureSpeedConstants.DownloadTestBlobName)
                {
                    if (cblob.Properties.LastModified.Value.CompareTo(oneMonthAgo) < 0)
                    {
                        cblob.DeleteAsync();
                    }
                }
            }
        }

        public void EnableLogging()
        {
            var serviceProperties = blobClient.GetServiceProperties();
            serviceProperties.Logging.LoggingOperations = LoggingOperations.All;
            serviceProperties.Logging.RetentionDays = 365;
            blobClient.SetServiceProperties(serviceProperties);
        }

        public async Task CreatePublicContainerAsync()
        {
            var container = blobClient.GetContainerReference(AzureSpeedConstants.PublicContainerName);
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
                if (blob != null && !blob.Exists())
                {
                    await CreateCallbackJsBlob();
                }
            }
        }

        public async Task CreatePrivateContainerAsync()
        {
            var container = blobClient.GetContainerReference(AzureSpeedConstants.PrivateContainerName);
            if (container != null)
            {
                // Create private container with no puublic access permission
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
            var container = blobClient.GetContainerReference(AzureSpeedConstants.PublicContainerName);
            string blobContent = $"latency._pingCallback('{blobClient.Credentials.AccountName}');";
            using (var stream = GenerateStreamFromString(blobContent))
            {
                var blob = container.GetBlockBlobReference(AzureSpeedConstants.CallBackBlobName);
                blob.UploadFromStream(stream);
                blob.Properties.ContentType = "application/javascript";
                await blob.SetPropertiesAsync();
            }
        }

        public async Task Upload100MBBlobAsync()
        {
            var container = blobClient.GetContainerReference(AzureSpeedConstants.PrivateContainerName);

            // Create 100MB.bin blob
            var blob = container.GetBlockBlobReference(AzureSpeedConstants.DownloadTestBlobName);
            if (blob != null && !blob.Exists())
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
            return new MemoryStream(Encoding.UTF8.GetBytes(s ?? ""));
        }
    }
}