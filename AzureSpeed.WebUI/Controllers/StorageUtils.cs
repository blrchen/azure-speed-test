using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Auth;
using Microsoft.WindowsAzure.Storage.Blob;
using System;
using AzureSpeed.WebUI.Models;

namespace AzureSpeed.WebUI.Controllers
{
    public static class StorageUtils
    {
        public static CloudStorageAccount CreateCloudStorageAccount(Account account, bool useHttps = false)
        {
            var storageAccount = account.UseChinaEndpoint
                ? new CloudStorageAccount(new StorageCredentials(account.Name, account.Key), "core.chinacloudapi.cn", useHttps)
                : new CloudStorageAccount(new StorageCredentials(account.Name, account.Key), useHttps);

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