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
        private readonly StorageAccountsContext storageAccountsContext;

        public LocalDataStoreContextTest()
        {
            this.storageAccountsContext = new StorageAccountsContext(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location));
        }

        [TestMethod]
        public void CanGetStorageAccounts()
        {
            var storageAccounts = this.storageAccountsContext.StorageAccounts.ToList();
            Assert.IsTrue(storageAccounts.Count > 0);
        }
    }
}