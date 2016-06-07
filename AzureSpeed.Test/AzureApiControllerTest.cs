namespace AzureSpeed.Test
{
    using System.IO;
    using System.Reflection;
    using Microsoft.VisualStudio.TestTools.UnitTesting;
    using WebUI;
    using WebUI.ApiControllers;

    [TestClass]
    public class AzureApiControllerTest
    {
        private readonly AzureApiController controller = new AzureApiController();

        private readonly string ipFilePath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location) +
                                             @"\TestData\";

        [TestMethod]
        public void TestGetRegionNameByIp()
        {
            string ip1 = "65.52.170.210";
            string eastAsiaRegion = controller.GetRegionNameByIpOrUrl(ip1, ipFilePath);
            Assert.AreEqual(eastAsiaRegion, "Azure - East Asia");

            string ip2 = "42.159.138.16";
            string eastChinaRegion = controller.GetRegionNameByIpOrUrl(ip2, ipFilePath);
            Assert.AreEqual(eastChinaRegion, "Azure - China East");

            string ip3 = "1.1.1.1";
            string noRegionFound = controller.GetRegionNameByIpOrUrl(ip3, ipFilePath);
            Assert.AreEqual(noRegionFound, "Region not found");
        }

        [TestMethod]
        public void TestGetRegionNameByUrl()
        {
            string url1 = "www.windowsazure.cn";
            string region1 = controller.GetRegionNameByIpOrUrl(url1, ipFilePath);
            Assert.AreEqual(region1, "Azure - China North");

            string url2 = "http://msn.com/";
            string region2 = controller.GetRegionNameByIpOrUrl(url2, ipFilePath);
            Assert.AreEqual(region2, "Azure - West US");

            string url3 = "amazon.com";
            string region3 = controller.GetRegionNameByIpOrUrl(url3, ipFilePath);
            Assert.AreEqual(region3, "AWS - US East (N. Virginia)");
        }

        [TestMethod]
        public void TestGetSubnetList()
        {
            var result = controller.GetSubnetList(ipFilePath);
            Assert.IsNotNull(result);
            Assert.IsTrue(result.Count > 0, "Sublist is empty");
        }

        [TestMethod]
        public void TestDeleteOutDatedBlobs()
        {
            controller.CleanUpBlobs();
        }
    }
}