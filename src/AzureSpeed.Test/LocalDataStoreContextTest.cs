using System.IO;
using System.Linq;
using System.Reflection;
using AzureSpeed.WebApp.Storage;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace AzureSpeed.Test
{
    [TestClass]
    public class LocalDataStoreContextTest
    {
        private readonly StorageAccountsProvider storageAccountsProvider;

        public LocalDataStoreContextTest()
        {
            storageAccountsProvider = new StorageAccountsProvider(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location));
        }

        [TestMethod]
        public void CanGetStorageAccounts()
        {
            var storageAccounts = this.storageAccountsProvider.StorageAccounts.ToList();
            Assert.IsTrue(storageAccounts.Count > 0);
        }
    }
}