using System.Threading.Tasks;
using AzureSpeed.WebApp.Providers;
using Microsoft.Extensions.Logging;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;

namespace AzureSpeed.Test
{
    [TestClass]
    public class AzureIPInfoInfoProviderTest
    {
        [TestMethod]
        public async Task TestLookupPublicAzureIPByUrl()
        {
            var mock = new Mock<ILogger<AzureIPInfoProvider>>();
            var provider = new AzureIPInfoProvider(mock.Object);
            var result = await provider.GetAzureIPInfo("portal-prod-southeastasia-02.southeastasia.cloudapp.azure.com");
            Assert.AreEqual("AzureCloud.southeastasia", result.ServiceTagId);
            Assert.AreEqual("52.139.236.115", result.IPAddress);
            Assert.AreEqual("52.139.192.0/18", result.IPAddressPrefix);
            Assert.AreEqual("southeastasia", result.Region);
            Assert.AreEqual("", result.SystemService);
        }

        [TestMethod]
        public async Task TestLookupPublicAzureIPByIPAddress()
        {
            var mockLogger = new Mock<ILogger<AzureIPInfoProvider>>();
            var provider = new AzureIPInfoProvider(mockLogger.Object);
            var result = await provider.GetAzureIPInfo("52.139.236.115");
            Assert.AreEqual("AzureCloud.southeastasia", result.ServiceTagId);
            Assert.AreEqual("52.139.236.115", result.IPAddress);
            Assert.AreEqual("52.139.192.0/18", result.IPAddressPrefix);
            Assert.AreEqual("southeastasia", result.Region);
            Assert.AreEqual("", result.SystemService);
        }

        [TestMethod]
        public async Task TestLookupAzureChinaCloudIPByUrl()
        {
            var mock = new Mock<ILogger<AzureIPInfoProvider>>();
            var provider = new AzureIPInfoProvider(mock.Object);
            var result = await provider.GetAzureIPInfo("portal-mc-chinaeast2-02.chinaeast2.cloudapp.chinacloudapi.cn");
            Assert.AreEqual("AzureCloud.chinaeast2", result.ServiceTagId);
            Assert.AreEqual("40.73.108.25", result.IPAddress);
            Assert.AreEqual("40.73.64.0/18", result.IPAddressPrefix);
            Assert.AreEqual("chinaeast2", result.Region);
            Assert.AreEqual("", result.SystemService);
        }

        [TestMethod]
        public async Task TestLookupAzureChinaCloudIPByIPAddress()
        {
            var mock = new Mock<ILogger<AzureIPInfoProvider>>();
            var provider = new AzureIPInfoProvider(mock.Object);
            var result = await provider.GetAzureIPInfo("40.73.108.25");
            Assert.AreEqual("AzureCloud.chinaeast2", result.ServiceTagId);
            Assert.AreEqual("40.73.108.25", result.IPAddress);
            Assert.AreEqual("40.73.64.0/18", result.IPAddressPrefix);
            Assert.AreEqual("chinaeast2", result.Region);
            Assert.AreEqual("", result.SystemService);
        }

        [TestMethod]
        public async Task TestLookupAzureUSGovernmentIPByUrl()
        {
            var mock = new Mock<ILogger<AzureIPInfoProvider>>();
            var provider = new AzureIPInfoProvider(mock.Object);
            var result = await provider.GetAzureIPInfo("portal-ff-usgovtexas-02.usgovtexas.cloudapp.usgovcloudapi.net");
            Assert.AreEqual("AzureCloud.usgovtexas", result.ServiceTagId);
            Assert.AreEqual("52.243.154.79", result.IPAddress);
            Assert.AreEqual("52.243.128.0/17", result.IPAddressPrefix);
            Assert.AreEqual("usgovtexas", result.Region);
            Assert.AreEqual("", result.SystemService);
        }

        [TestMethod]
        public async Task TestLookupAzureUSGovernmentIPByIPAddress()
        {
            var mock = new Mock<ILogger<AzureIPInfoProvider>>();
            var provider = new AzureIPInfoProvider(mock.Object);
            var result = await provider.GetAzureIPInfo("52.243.154.79");
            Assert.AreEqual("AzureCloud.usgovtexas", result.ServiceTagId);
            Assert.AreEqual("52.243.154.79", result.IPAddress);
            Assert.AreEqual("52.243.128.0/17", result.IPAddressPrefix);
            Assert.AreEqual("usgovtexas", result.Region);
            Assert.AreEqual("", result.SystemService);
        }

        [TestMethod]
        public async Task TestLookupInvalidIPAddress()
        {
            var mock = new Mock<ILogger<AzureIPInfoProvider>>();
            var provider = new AzureIPInfoProvider(mock.Object);

            var result = await provider.GetAzureIPInfo("1.1.1.1");
            Assert.AreEqual(null, result.ServiceTagId);
            Assert.AreEqual(null, result.IPAddress);
            Assert.AreEqual(null, result.IPAddressPrefix);
            Assert.AreEqual(null, result.Region);
            Assert.AreEqual(null, result.SystemService);
        }
    }
}
