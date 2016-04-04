namespace AzureSpeed.WebUI.Controllers
{
    using System;
    using Microsoft.WindowsAzure.Storage;
    using Microsoft.WindowsAzure.Storage.Auth;
    using Microsoft.WindowsAzure.Storage.Blob;
    using Models;

    public static class StorageUtils
    {
        public static CloudStorageAccount CreateCloudStorageAccount(Account account, bool useHttps = false)
        {
            string endpointSuffix = string.IsNullOrEmpty(account.EndpointSuffix)
                ? "core.windows.net"
                : account.EndpointSuffix;

            var storageAccount = new CloudStorageAccount(new StorageCredentials(account.Name, account.Key),
                endpointSuffix, useHttps);
            return storageAccount;
        }

        public static string GetSasUrl(ICloudBlob blob, SharedAccessBlobPermissions permissions)
        {
            var policy = new SharedAccessBlobPolicy
            {
                SharedAccessExpiryTime = DateTime.Now.AddMinutes(30),
                Permissions = permissions
            };
            string sasBlobToken = blob.GetSharedAccessSignature(policy);
            //Return the URI string for the container, including the SAS token.
            return blob.Uri + sasBlobToken;
        }
    }
}