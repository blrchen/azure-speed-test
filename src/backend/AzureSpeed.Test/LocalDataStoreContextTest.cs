using AzureSpeed.Common.LocalData;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.IO;
using System.Linq;
using System.Reflection;

namespace AzureSpeed.Test
{
    [TestClass]
    public class LocalDataStoreContextTest
    {
        private readonly LocalDataStoreContext localDataStoreContext;

        public LocalDataStoreContextTest()
        {
            this.localDataStoreContext = new LocalDataStoreContext(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location));
        }

        [TestMethod]
        public void CanGetStorageAccounts()
        {
            var storageAccounts = this.localDataStoreContext.StorageAccounts.ToList();
            Assert.IsTrue(storageAccounts.Count > 0);
        }

        [TestMethod]
        public void CanGetSubnets()
        {
            var subnets = this.localDataStoreContext.Subnets;
            Assert.IsTrue(subnets.Count > 0);
        }

        [TestMethod]
        public void CanGetRegionNameByIp()
        {
            // ip of azure.com
            string ipOfAzureCom = "168.62.225.23";
            var eastAsiaRegion = this.localDataStoreContext.GetRegionInfo(ipOfAzureCom);
            Assert.AreEqual("Azure", eastAsiaRegion.Cloud);
            Assert.AreEqual("North Central US", eastAsiaRegion.Region);
            Assert.AreEqual(ipOfAzureCom, eastAsiaRegion.IPAddress);

            // ip of azure.cn
            string ipOfAzureCN = "42.159.5.43";
            var eastChinaRegion = this.localDataStoreContext.GetRegionInfo(ipOfAzureCN);
            Assert.AreEqual("Azure", eastAsiaRegion.Cloud);
            Assert.AreEqual("China North", eastChinaRegion.Region);
            Assert.AreEqual(ipOfAzureCN, eastChinaRegion.IPAddress);

            string ipOfAzureSpeedCom = "104.45.231.79";
            var azureSpeedRegion = this.localDataStoreContext.GetRegionInfo("www.azurespeed.com");
            Assert.AreEqual("Azure", eastAsiaRegion.Cloud);
            Assert.AreEqual("West US", azureSpeedRegion.Region);
            Assert.AreEqual(ipOfAzureSpeedCom, azureSpeedRegion.IPAddress);

            var azureSpeedRegion1 = this.localDataStoreContext.GetRegionInfo("https://www.azurespeed.com/");
            Assert.AreEqual("Azure", eastAsiaRegion.Cloud);
            Assert.AreEqual("West US", azureSpeedRegion1.Region);
            Assert.AreEqual(ipOfAzureSpeedCom, azureSpeedRegion1.IPAddress);

            var noRegion = this.localDataStoreContext.GetRegionInfo("1.1.1.1");
            Assert.IsTrue(string.IsNullOrEmpty(noRegion.Region));

            var invalidHostRegion = this.localDataStoreContext.GetRegionInfo("88888888888888888888.888");
            Assert.IsTrue(string.IsNullOrEmpty(invalidHostRegion.Region));
        }

        [TestMethod]
        public void CanGetIpRange()
        {
            var ipRange = localDataStoreContext.GetIpRange();
            Assert.IsTrue(ipRange.Count > 0);
        }
    }
}