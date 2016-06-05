namespace AzureSpeed.WebUI
{
    using System.Collections.Generic;
    using System.IO;
    using System.Web.Hosting;
    using Common;
    using Newtonsoft.Json;

    public static class AzureSpeedData
    {
        private static IEnumerable<StorageAccount> accounts;

        private static Dictionary<string, string> regionNames;

        public static IEnumerable<StorageAccount> Accounts
        {
            get
            {
                if (accounts == null)
                {
                    // Change to absoluted path when running with AdminConsole.exe
                    string filePath = @"C:\AzureSpeed\AzureSpeed.WebUI\App_Data\settings.json";
                    //string filePath = Path.Combine(HostingEnvironment.MapPath("~/App_Data/"), "settings.json");

                    var text = File.ReadAllText(filePath);
                    var setting = JsonConvert.DeserializeObject<Settings>(text);
                    accounts = setting.Accounts;
                }

                return accounts;
            }
        }

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
                    regionNames.Add("australiaeast", "Azure - Australia East");
                    regionNames.Add("australiasoutheast", "Azure - Australia Southeast");
                    regionNames.Add("chinanorth", "Azure - China North");
                    regionNames.Add("chinaeast", "Azure - China East");
                    regionNames.Add("indiacentral", "Azure - India Central");
                    regionNames.Add("indiawest", "Azure - India West");
                    regionNames.Add("indiasouth", "Azure - India South");

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
                    regionNames.Add("us-gov-west-1", "AWS - US Gov");
                    regionNames.Add("cn-north-1", "AWS - China North (Beijing)");
                    // AliCloud
                    regionNames.Add("alicloud", "AliCloud");
                }
                return regionNames;
            }
        }
    }
}