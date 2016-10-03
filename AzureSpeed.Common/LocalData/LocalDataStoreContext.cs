using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Xml;
using AzureSpeed.Common.Models;
using AzureSpeed.Common.Models.AWS;
using AzureSpeed.Common.Models.Responses;
using AzureSpeed.Common.Models.ViewModels;
using AzureSpeed.Common.Storage;
using LukeSkywalker.IPNetwork;
using Newtonsoft.Json;

namespace AzureSpeed.Common.LocalData
{
    public class LocalDataStoreContext
    {
        private readonly string dataFilePath;
        private readonly string azureIpFileList;
        private readonly string awsIpFile;
        private readonly string aliCloudIpFile;
        private Dictionary<string, CloudRegion> regionNames;
        private IDictionary<IPNetwork, string> subnetDictionary;
        private IEnumerable<StorageAccount> accounts;

        public LocalDataStoreContext(string dataPath, string azureIpFileList, string awsIpFile, string aliCloudIpFile)
        {
            this.dataFilePath = dataPath;
            this.azureIpFileList = azureIpFileList;
            this.awsIpFile = awsIpFile;
            this.aliCloudIpFile = aliCloudIpFile;
        }

        public IEnumerable<StorageAccount> StorageAccounts
        {
            get
            {
                if (this.accounts == null)
                {
                    string filePath = Path.Combine(dataFilePath, @"Data\settings.json");
                    var text = File.ReadAllText(filePath);
                    var setting = JsonConvert.DeserializeObject<Settings>(text);
                    this.accounts = setting.Accounts;
                }

                return this.accounts;
            }
        }

        public Dictionary<string, CloudRegion> RegionNames
        {
            get
            {
                if (this.regionNames == null)
                {
                    // The list is from ip file xml file.
                    // Needs to be update when new data center opens.
                    // TODO: Generate this list from ip files on the flying??
                    this.regionNames = new Dictionary<string, CloudRegion>();

                    // Azure, sorted by PublicIPs.xml
                    this.regionNames.Add("europewest", new CloudRegion { Cloud = "Azure", Region = "West Europe", Location = "Netherlands" });
                    this.regionNames.Add("useast", new CloudRegion { Cloud = "Azure", Region = "East US", Location = "Iowa" });
                    this.regionNames.Add("useast2", new CloudRegion { Cloud = "Azure", Region = "East US 2", Location = "Iowa" });
                    this.regionNames.Add("uswest", new CloudRegion { Cloud = "Azure", Region = "West US", Location = "California" });
                    this.regionNames.Add("usnorth", new CloudRegion { Cloud = "Azure", Region = "North Central US", Location = "Illinois" });
                    this.regionNames.Add("europenorth", new CloudRegion { Cloud = "Azure", Region = "North Europe", Location = "Ireland" });
                    this.regionNames.Add("uscentral", new CloudRegion { Cloud = "Azure", Region = "Central US", Location = "Iowa" });
                    this.regionNames.Add("asiaeast", new CloudRegion { Cloud = "Azure", Region = "East Asia", Location = "Hong Kong" });
                    this.regionNames.Add("asiasoutheast", new CloudRegion { Cloud = "Azure", Region = "Southeast Asia", Location = "Hong Kong" });
                    this.regionNames.Add("ussouth", new CloudRegion { Cloud = "Azure", Region = "SouthCentral US", Location = "Texas" });
                    this.regionNames.Add("japanwest", new CloudRegion { Cloud = "Azure", Region = "Japan West", Location = "Osaka Prefecture" });
                    this.regionNames.Add("japaneast", new CloudRegion { Cloud = "Azure", Region = "Japan East", Location = "Saitama Prefecture" });
                    this.regionNames.Add("brazilsouth", new CloudRegion { Cloud = "Azure", Region = "Brazil South", Location = "Sao Paulo State" });
                    this.regionNames.Add("australiaeast", new CloudRegion { Cloud = "Azure", Region = "Australia East", Location = "New South Wales" });
                    this.regionNames.Add("australiasoutheast", new CloudRegion { Cloud = "Azure", Region = "Australia Southeast", Location = "Victoria" });
                    this.regionNames.Add("indiacentral", new CloudRegion { Cloud = "Azure", Region = "Central India", Location = "Pune" });
                    this.regionNames.Add("indiawest", new CloudRegion { Cloud = "Azure", Region = "West India", Location = "Mumbai" });
                    this.regionNames.Add("indiasouth", new CloudRegion { Cloud = "Azure", Region = "South India", Location = "Chennai" });
                    this.regionNames.Add("canadaeast", new CloudRegion { Cloud = "Azure", Region = "Canada East", Location = "Quebec City" });
                    this.regionNames.Add("canadacentral", new CloudRegion { Cloud = "Azure", Region = "Canada Central", Location = "Toronto" });
                    this.regionNames.Add("uswest2", new CloudRegion { Cloud = "Azure", Region = "West US 2", Location = "West US 2" });
                    this.regionNames.Add("uswestcentral", new CloudRegion { Cloud = "Azure", Region = "West Central US", Location = "West Central US" });
                    this.regionNames.Add("chinanorth", new CloudRegion { Cloud = "Azure", Region = "China North", Location = "Beijing" });
                    this.regionNames.Add("chinaeast", new CloudRegion { Cloud = "Azure", Region = "China East", Location = "Shanghai" });

                    // AWS
                    this.regionNames.Add("ap-northeast-1", new CloudRegion { Cloud = "AWS", Region = "Asia Pacific", Location = "Tokyo" });
                    this.regionNames.Add("ap-northeast-2", new CloudRegion { Cloud = "AWS", Region = "Asia Pacific", Location = "Seoul" });
                    this.regionNames.Add("ap-south-1", new CloudRegion { Cloud = "AWS", Region = "Asia Pacific", Location = "Mumbai" });
                    this.regionNames.Add("ap-southeast-1", new CloudRegion { Cloud = "AWS", Region = "Asia Pacific", Location = "Singapore" });
                    this.regionNames.Add("ap-southeast-2", new CloudRegion { Cloud = "AWS", Region = "Asia Pacific", Location = "Sydney" });
                    this.regionNames.Add("cn-north-1", new CloudRegion { Cloud = "AWS", Region = "China North", Location = "Beijing" });
                    this.regionNames.Add("eu-central-1", new CloudRegion { Cloud = "AWS", Region = "EU", Location = "Frankfurt" });
                    this.regionNames.Add("eu-west-1", new CloudRegion { Cloud = "AWS", Region = "EU", Location = "Ireland" });
                    this.regionNames.Add("Global", new CloudRegion { Cloud = "AWS", Region = string.Empty, Location = string.Empty });
                    this.regionNames.Add("sa-east-1", new CloudRegion { Cloud = "AWS", Region = "South America", Location = "Sao Paulo" });
                    this.regionNames.Add("us-east-1", new CloudRegion { Cloud = "AWS", Region = "US East", Location = "N. Virginia" });
                    this.regionNames.Add("us-gov-west-1", new CloudRegion { Cloud = "AWS", Region = "US Gov", Location = string.Empty });
                    this.regionNames.Add("us-west-1", new CloudRegion { Cloud = "AWS", Region = "US West", Location = "N. California" });
                    this.regionNames.Add("us-west-2", new CloudRegion { Cloud = "AWS", Region = "US West", Location = "Oregon" });

                    //// AliCloud
                    regionNames.Add("alicloud", new CloudRegion { Cloud = "AliCloud", Region = string.Empty });
                }

                return regionNames;
            }
        }

        public IDictionary<IPNetwork, string> Subnets
        {
            get
            {
                if (subnetDictionary == null)
                {
                    subnetDictionary = CreateSubnetDictionary();
                }

                return subnetDictionary;
            }
        }

        public List<IpRangeViewModel> GetIpRange()
        {
            var result = new List<IpRangeViewModel>();

            string ipFileList = this.azureIpFileList;
            foreach (string filePath in ipFileList.Split(';'))
            {
                var xmlDoc = new XmlDocument();
                xmlDoc.Load(this.dataFilePath + @"\Data\IpRangeFiles\Azure\" + filePath);
                var root = xmlDoc.DocumentElement;
                foreach (XmlElement ele in root)
                {
                    string region = ele.GetAttribute("Name");
                    var ipRange = new IpRangeViewModel { Cloud = "Azure", Region = region, Subnet = new List<string>() };
                    foreach (XmlElement xe in ele)
                    {
                        string subnet = xe.GetAttribute("Subnet");
                        ipRange.Subnet.Add(subnet);
                        ipRange.TotalIpCount += IPNetwork.Parse(subnet).Total;
                    }

                    result.Add(ipRange);
                }
            }

            // Load AWS ip range data
            string json = File.ReadAllText(this.dataFilePath + @"\Data\IpRangeFiles\AWS\" + this.awsIpFile);
            var awsIpRangeData = JsonConvert.DeserializeObject<AwsIpRangeData>(json);
            foreach (var prefix in awsIpRangeData.Prefixes)
            {
                string region = prefix.Region;
                string subnet = prefix.IpPrefix;
                if (result.Any(v => v.Region == region))
                {
                    var ipRange = result.First(v => v.Region == region);
                    ipRange.Subnet.Add(subnet);
                    ipRange.TotalIpCount += IPNetwork.Parse(subnet).Total;
                }
                else
                {
                    var ipRange = new IpRangeViewModel { Cloud = "AWS", Region = region, Subnet = new List<string>() };
                    ipRange.Subnet.Add(subnet);
                    ipRange.TotalIpCount += IPNetwork.Parse(subnet).Total;
                    result.Add(ipRange);
                }
            }

            // Load AliCloud ip range data
            string aliCloudIpFile = this.aliCloudIpFile;
            string[] lines = File.ReadAllLines(this.dataFilePath + @"\Data\IpRangeFiles\AliCloud\" + aliCloudIpFile);
            var aliIpRange = new IpRangeViewModel { Cloud = "AliCloud", Region = "AliCloud", Subnet = new List<string>() };
            foreach (var line in lines)
            {
                string subnet = line;
                aliIpRange.Subnet.Add(subnet);
                aliIpRange.TotalIpCount += IPNetwork.Parse(subnet).Total;
            }

            result.Add(aliIpRange);

            return result;
        }

        public RegionInfo GetRegionInfoByIpOrUrl(string ipOrUrl)
        {
            if (string.IsNullOrEmpty(ipOrUrl))
            {
                throw new Exception("Must specify a valid ipAddress or url");
            }

            var result = new RegionInfo();
            if (!(ipOrUrl.StartsWith("http://") || ipOrUrl.StartsWith("https://")))
            {
                ipOrUrl = "http://" + ipOrUrl;
            }

            Uri tmp = new Uri(ipOrUrl);
            ipOrUrl = tmp.Host;

            var ips = Dns.GetHostAddresses(ipOrUrl);
            var ipAddr = ips[0];
            result.IpAddress = ipAddr.ToString();
            foreach (var net in Subnets.Keys)
            {
                if (IPNetwork.Contains(net, ipAddr))
                {
                    var regionAlias = Subnets[net];
                    result.Cloud = RegionNames[regionAlias].Cloud;
                    result.Region = RegionNames[regionAlias].Region;
                    result.Location = RegionNames[regionAlias].Location;
                    break;
                }
            }

            return result;
        }

        private IDictionary<IPNetwork, string> CreateSubnetDictionary()
        {
            var subnets = new Dictionary<IPNetwork, string>();

            foreach (string filePath in this.azureIpFileList.Split(';'))
            {
                var xmlDoc = new XmlDocument();
                xmlDoc.Load(this.dataFilePath + @"\Data\IpRangeFiles\Azure\" + filePath);
                var root = xmlDoc.DocumentElement;
                foreach (XmlElement ele in root)
                {
                    string region = ele.GetAttribute("Name");
                    foreach (XmlElement ipRange in ele)
                    {
                        var subnet = ipRange.GetAttribute("Subnet");
                        IPNetwork net;
                        if (IPNetwork.TryParse(subnet, out net))
                        {
                            if (!subnets.ContainsKey(net))
                            {
                                subnets.Add(net, region);
                            }
                        }
                    }
                }
            }

            // Get AWS ip range data
            string json = File.ReadAllText(this.dataFilePath + @"\Data\IpRangeFiles\AWS\" + this.awsIpFile);

            var awsIpRangeData = JsonConvert.DeserializeObject<AwsIpRangeData>(json);
            foreach (var prefix in awsIpRangeData.Prefixes)
            {
                IPNetwork net;
                if (IPNetwork.TryParse(prefix.IpPrefix, out net))
                {
                    if (!subnets.ContainsKey(net))
                    {
                        subnets.Add(net, prefix.Region);
                    }
                }
            }

            // Get AliCloud ip range data
            string[] lines = File.ReadAllLines(this.dataFilePath + @"\Data\IpRangeFiles\AliCloud\" + this.aliCloudIpFile);
            foreach (var line in lines)
            {
                IPNetwork net;
                if (IPNetwork.TryParse(line, out net))
                {
                    if (!subnets.ContainsKey(net))
                    {
                        subnets.Add(net, "alicloud");
                    }
                }
            }

            return subnets;
        }
    }
}