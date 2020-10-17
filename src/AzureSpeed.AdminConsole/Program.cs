using System;

namespace AzureSpeed.AdminConsole
{
    public class Program
    {
        // This tool setups everything needed for an Azure storage account to run speed test.
        //
        // It performs following steps
        //   1. Enable CORS
        //   2. Create 3 containers (public/private/upload)
        //   3. Upload a latency-test.json which is used by latency test
        //   4. Upload a 100 MB dummy file for download speed test.
        //
        // Note: to run this tool, you need
        //   1. Update settings.json to have correct storage name and key
        //   2. File C:\DelMe\100MB.bin exists
        public static void Main(string[] args = null)
        {
            var storageAccountInitializer = new StorageAccountInitializer();
            storageAccountInitializer.InitializeAsync().Wait();
            Console.ReadLine();
        }
    }
}