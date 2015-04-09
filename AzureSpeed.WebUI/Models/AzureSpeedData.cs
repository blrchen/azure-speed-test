using System.Collections.Generic;
using System.IO;
using System.Web.Hosting;
using System.Web.Script.Serialization;

namespace AzureSpeed.WebUI.Models
{
    public static class AzureSpeedData
    {
        private static IEnumerable<Account> accounts;
        public static IEnumerable<Account> Accounts
        {
            get
            {
                if (accounts == null)
                {
                    var serializer = new JavaScriptSerializer();
                    string filePath = Path.Combine(HostingEnvironment.MapPath("~/App_Data/"), "key.json");
                    var text = File.ReadAllText(filePath);
                    var setting = serializer.Deserialize<Setting>(text);
                    accounts = setting.Accounts;
                }

                return accounts;
            }
        }

        private static Dictionary<string, string> regionNames;
        public static Dictionary<string, string> RegionNames
        {
            get
            {
                if (regionNames == null)
                {
                    // The list is from ip file xml file.
                    // Needs to be update when new data center opens.
                    regionNames = new Dictionary<string, string>();

                    // Azure
                    regionNames.Add("europewest", "Azure - West Europe");
                    regionNames.Add("useast", "Azure - East US");
                    regionNames.Add("useast2", "Azure - East US 2");
                    regionNames.Add("uswest", "Azure - West US");
                    regionNames.Add("usnorth", "Azure - North Central US");
                    regionNames.Add("europenorth", "Azure - North Europe");
                    regionNames.Add("uscentral", "Azure - Central US");
                    regionNames.Add("asiaeast", "Azure - East Asia");
                    regionNames.Add("asiasoutheast", "Azure - Southeast Asia");
                    regionNames.Add("ussouth", "Azure - SouthCentral US");
                    regionNames.Add("japanwest", "Azure - Japan West");
                    regionNames.Add("japaneast", "Azure - Japan East");
                    regionNames.Add("brazilsouth", "Azure - Brazil South");
                    regionNames.Add("aueast", "Azure - Australia East");
                    regionNames.Add("ausoutheast", "Azure - Australia Southeast");
                    regionNames.Add("chinanorth", "Azure - China North");
                    regionNames.Add("chinaeast", "Azure - China East");
                    // AWS
                    regionNames.Add("ap-northeast-1", "AWS - Asia Pacific (Tokyo)");
                    regionNames.Add("ap-southeast-1", "AWS - Asia Pacific (Singapore)");
                    regionNames.Add("ap-southeast-2", "AWS - Asia Pacific (Sydney)");
                    regionNames.Add("eu-central-1", "AWS - EU (Frankfurt)");
                    regionNames.Add("eu-west-1", "AWS - EU (Ireland)");
                    regionNames.Add("sa-east-1", "AWS - South America (Sao Paulo)");
                    regionNames.Add("us-east-1", "AWS - US East (N. Virginia)");
                    regionNames.Add("us-west-1", "AWS - US West (N. California)");
                    regionNames.Add("us-west-2", "AWS - US West (Oregon)");
                    // AliCloud
                    regionNames.Add("alicloud", "AliCloud");
                }
                return regionNames;
            }
        }
    }
}
