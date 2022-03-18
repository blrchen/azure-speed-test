﻿using System;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using AzureSpeed.WebApp.Common;

namespace AzureSpeed.WebApp.Storage
{
    public class BlobProvider
    {
        private readonly string connectionString;

        public BlobProvider(StorageAccount account)
        {
            connectionString = $"DefaultEndpointsProtocol=https;AccountName={account.Name};AccountKey={account.Key}";
        }

        public string GetSasUrl(string blobName, string operation)
        {
            string containerName = string.Empty;
            var blobSasPermissions = BlobSasPermissions.List;
            switch (operation.ToLower())
            {
                case "upload":
                    blobSasPermissions |= BlobSasPermissions.Write;
                    containerName = AzureSpeedConstants.UploadContainerName;
                    break;
                case "download":
                    blobSasPermissions |= BlobSasPermissions.Read;
                    containerName = AzureSpeedConstants.PrivateContainerName;
                    break;
            }

            var blobContainerClient = new BlobContainerClient(connectionString, containerName);
            var blobClient = blobContainerClient.GetBlobClient(blobName);
            var uri = blobClient.GenerateSasUri(blobSasPermissions, DateTimeOffset.UtcNow.AddMinutes(5));
            return uri.ToString();
        }
    }
}