using System.Configuration;
using System.IO;
using System.Linq;
using System.Reflection;
using AzureSpeed.Common.LocalData;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace AzureSpeed.Test
{
    [TestClass]
    public class LocalDataStoreContextTest
    {
        private readonly LocalDataStoreContext localDataStoreContext;

        public LocalDataStoreContextTest()
        {
            this.localDataStoreContext = new LocalDataStoreContext(
                Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location),
                ConfigurationManager.AppSettings["AzureIpRangeFileList"],
                ConfigurationManager.AppSettings["AwsIpRangeFile"],
                ConfigurationManager.AppSettings["AliCloudIpRangeFile"]);
        }

        [TestMethod]
        public void CanGetStorageAccounts()
        {
            var storageAccounts = localDataStoreContext.StorageAccounts.ToList();
            Assert.IsTrue(storageAccounts.Count > 0);
        }

        [TestMethod]
        public void CanGetSubnets()
        {
            var subnets = localDataStoreContext.Subnets;
            Assert.IsTrue(subnets.Count > 0);
        }

        [TestMethod]
        public void CanGetRegionNameByIp()
        {
            // ip of azure.com
            string ipOfAzureCom = "168.62.225.23";
            var eastAsiaRegion = this.localDataStoreContext.GetRegionInfoByIpOrUrl(ipOfAzureCom);
            Assert.AreEqual("Azure", eastAsiaRegion.Cloud);
            Assert.AreEqual("North Central US", eastAsiaRegion.Region);
            Assert.AreEqual(ipOfAzureCom, eastAsiaRegion.IpAddress);

            // ip of azure.cn
            string ipOfAzureCN = "42.159.5.43";
            var eastChinaRegion = this.localDataStoreContext.GetRegionInfoByIpOrUrl(ipOfAzureCN);
            Assert.AreEqual("Azure", eastAsiaRegion.Cloud);
            Assert.AreEqual("China North", eastChinaRegion.Region);
            Assert.AreEqual(ipOfAzureCN, eastChinaRegion.IpAddress);

            string ipOfAzureSpeedCom = "168.62.20.37";
            var azureSpeedRegion = this.localDataStoreContext.GetRegionInfoByIpOrUrl("www.azurespeed.com");
            Assert.AreEqual("Azure", eastAsiaRegion.Cloud);
            Assert.AreEqual("West US", azureSpeedRegion.Region);
            Assert.AreEqual(ipOfAzureSpeedCom, azureSpeedRegion.IpAddress);

            var azureSpeedRegion1 = this.localDataStoreContext.GetRegionInfoByIpOrUrl("http://www.azurespeed.com/");
            Assert.AreEqual("Azure", eastAsiaRegion.Cloud);
            Assert.AreEqual("West US", azureSpeedRegion1.Region);
            Assert.AreEqual(ipOfAzureSpeedCom, azureSpeedRegion1.IpAddress);

            string ipOfAwsConsole = "54.239.26.209";
            var awsConsoleRegion = this.localDataStoreContext.GetRegionInfoByIpOrUrl("aws.amazon.com");
            Assert.AreEqual("AWS", awsConsoleRegion.Cloud);
            Assert.AreEqual("US East (N. Virginia)", awsConsoleRegion.Region);
            Assert.AreEqual(ipOfAwsConsole, awsConsoleRegion.IpAddress);

            var noRegion = this.localDataStoreContext.GetRegionInfoByIpOrUrl("1.1.1.1");
            Assert.IsTrue(string.IsNullOrEmpty(noRegion.Region));
        }

        [TestMethod]
        public void CanGetIpRange()
        {
            var ipRange = localDataStoreContext.GetIpRange();
            Assert.IsTrue(ipRange.Count > 0);
        }
    }
}