using System;

namespace AzureSpeed.AdminConsole
{
    public class Program
    {
        // This tool setups everything needed for an Azure storage account to run speed test.
        //
        // It performs following steps
        //   1. Enable CORS
        //   2. Create a container azurespeed
        //   3. Create a callback.js which is used by latency test
        //   4. Upload a 100 mb dummy file for download speed test.
        //
        // Note: to run this tool, you need
        //   1. Update settings.json to have correct storage name and key
        //   2. Have 100MB.bin file in c:\DelMe
        public static void Main(string[] args = null)
        {
            var storageAccountInitilizer = new StorageAccountInitilizer();
            storageAccountInitilizer.InitializeAsync().Wait();
            Console.ReadLine();
        }
    }
}

