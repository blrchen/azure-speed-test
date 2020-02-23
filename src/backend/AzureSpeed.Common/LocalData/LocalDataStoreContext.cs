using AzureSpeed.Common.Models;
using AzureSpeed.Common.Models.AWS;
using AzureSpeed.Common.Models.Responses;
using AzureSpeed.Common.Models.ViewModels;
using AzureSpeed.Common.Storage;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Xml;

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
                    // Needs to be update when new datacenter opens.
                    // TODO: Generate this list from ip files on the flying??
                    this.regionNames = new Dictionary<string, CloudRegion>
                    {
                        // Azure, sorted by PublicIPs.xml
                        // TODO: Get data from common.js
                        { "uswest", new CloudRegion { Cloud = "Azure", RegionId = "uswest", Region = "West US", Location = "California" } },
                        { "useast", new CloudRegion { Cloud = "Azure", RegionId = "useast", Region = "East US", Location = "Iowa" } },
                        { "useast2", new CloudRegion { Cloud = "Azure", RegionId = "useast2", Region = "East US 2", Location = "Iowa" } },
                        { "usnorth", new CloudRegion { Cloud = "Azure", RegionId = "usnorth", Region = "North Central US", Location = "Illinois" } },
                        { "uswest2", new CloudRegion { Cloud = "Azure", RegionId = "uswest2", Region = "West US 2", Location = "West US 2" } },
                        { "ussouth", new CloudRegion { Cloud = "Azure", RegionId = "ussouth", Region = "SouthCentral US", Location = "Texas" } },
                        { "uscentral", new CloudRegion { Cloud = "Azure", RegionId = "uscentral", Region = "Central US", Location = "Iowa" } },
                        { "europewest", new CloudRegion { Cloud = "Azure", RegionId = "europewest", Region = "West Europe", Location = "Netherlands" } },
                        { "europenorth", new CloudRegion { Cloud = "Azure", RegionId = "europenorth", Region = "North Europe", Location = "Ireland" } },
                        { "asiaeast", new CloudRegion { Cloud = "Azure", RegionId = "asiaeast", Region = "East Asia", Location = "Hong Kong" } },
                        { "asiasoutheast", new CloudRegion { Cloud = "Azure", RegionId = "asiasoutheast", Region = "Southeast Asia", Location = "Singapore" } },
                        { "japaneast", new CloudRegion { Cloud = "Azure", RegionId = "japaneast", Region = "Japan East", Location = "Saitama Prefecture" } },
                        { "japanwest", new CloudRegion { Cloud = "Azure", RegionId = "japanwest", Region = "Japan West", Location = "Osaka Prefecture" } },
                        { "brazilsouth", new CloudRegion { Cloud = "Azure", RegionId = "brazilsouth", Region = "Brazil South", Location = "Sao Paulo State" } },
                        { "australiaeast", new CloudRegion { Cloud = "Azure", RegionId = "australiaeast", Region = "Australia East", Location = "New South Wales" } },
                        { "australiasoutheast", new CloudRegion { Cloud = "Azure", RegionId = "australiasoutheast", Region = "Australia Southeast", Location = "Victoria" } },
                        { "indiasouth", new CloudRegion { Cloud = "Azure", RegionId = "indiasouth", Region = "South India", Location = "Chennai" } },
                        { "indiawest", new CloudRegion { Cloud = "Azure", RegionId = "indiawest", Region = "West India", Location = "Mumbai" } },
                        { "indiacentral", new CloudRegion { Cloud = "Azure", RegionId = "indiacentral", Region = "Central India", Location = "Pune" } },
                        { "canadacentral", new CloudRegion { Cloud = "Azure", RegionId = "canadacentral", Region = "Canada Central", Location = "Toronto" } },
                        { "canadaeast", new CloudRegion { Cloud = "Azure", RegionId = "canadaeast", Region = "Canada East", Location = "Quebec City" } },
                        { "uswestcentral", new CloudRegion { Cloud = "Azure", RegionId = "uswestcentral", Region = "West Central US", Location = "West Central US" } },
                        { "ukwest", new CloudRegion { Cloud = "Azure", RegionId = "ukwest", Region = "UK West", Location = "Cardiff" } },
                        { "uksouth", new CloudRegion { Cloud = "Azure", RegionId = "uksouth", Region = "UK South", Location = "London" } },
                        { "koreasouth", new CloudRegion { Cloud = "Azure", RegionId = "koreasouth", Region = "Korea South", Location = "Busan" } },
                        { "koreacentral", new CloudRegion { Cloud = "Azure", RegionId = "koreacentral", Region = "Korea Central", Location = "Seoul" } },
                        { "chinaeast", new CloudRegion { Cloud = "Azure", RegionId = "chinaeast", Region = "China East", Location = "Shanghai" } },
                        { "chinanorth", new CloudRegion { Cloud = "Azure", RegionId = "chinanorth", Region = "China North", Location = "Beijing" } },

                        // AWS https://docs.amazonaws.cn/en_us/general/latest/gr/rande.html#autoscaling_region
                        { "us-east-2", new CloudRegion { Cloud = "AWS", RegionId = "us-east-2", Region = "US East", Location = "Ohio" } },
                        { "us-east-1", new CloudRegion { Cloud = "AWS", RegionId = "us-east-1", Region = "US East", Location = "N. Virginia" } },
                        { "us-west-1", new CloudRegion { Cloud = "AWS", RegionId = "us-west-1", Region = "US West", Location = "N. California" } },
                        { "us-west-2", new CloudRegion { Cloud = "AWS", RegionId = "us-west-2", Region = "US West", Location = "Oregon" } },
                        { "ap-south-1", new CloudRegion { Cloud = "AWS", RegionId = "ap-south-1", Region = "Asia Pacific", Location = "Mumbai" } },
                        { "ap-northeast-3", new CloudRegion { Cloud = "AWS", RegionId = "ap-northeast-3", Region = "Asia Pacific", Location = "Osaka-Local" } },
                        { "ap-northeast-2", new CloudRegion { Cloud = "AWS", RegionId = "ap-northeast-2", Region = "Asia Pacific", Location = "Seoul" } },
                        { "ap-southeast-1", new CloudRegion { Cloud = "AWS", RegionId = "ap-southeast-1", Region = "Asia Pacific", Location = "Singapore" } },
                        { "ap-southeast-2", new CloudRegion { Cloud = "AWS", RegionId = "ap-southeast-2", Region = "Asia Pacific", Location = "Sydney" } },
                        { "ap-northeast-1", new CloudRegion { Cloud = "AWS", RegionId = "ap-northeast-1", Region = "Asia Pacific", Location = "Tokyo" } },
                        { "ca-central-1", new CloudRegion { Cloud = "AWS", RegionId = "ca-central-1", Region = "Asia Pacific", Location = "Central" } },
                        { "cn-north-1", new CloudRegion { Cloud = "AWS", RegionId = "cn-north-1", Region = "China", Location = "Beijing" } },
                        { "cn-northwest-1", new CloudRegion { Cloud = "AWS", RegionId = "cn-northwest-1", Region = "China", Location = "Ningxia" } },
                        { "eu-central-1", new CloudRegion { Cloud = "AWS", RegionId = "eu-central-1", Region = "EU", Location = "Frankfurt" } },
                        { "eu-west-1", new CloudRegion { Cloud = "AWS", RegionId = "eu-west-1", Region = "EU", Location = "Ireland" } },
                        { "eu-west-2", new CloudRegion { Cloud = "AWS", RegionId = "eu-west-2", Region = "EU", Location = "London" } },
                        { "eu-west-3", new CloudRegion { Cloud = "AWS", RegionId = "eu-west-3", Region = "EU", Location = "Paris" } },
                        { "eu-north-1", new CloudRegion { Cloud = "AWS", RegionId = "eu-north-1", Region = "EU", Location = "Stockholm" } },
                        { "sa-east-1", new CloudRegion { Cloud = "AWS", RegionId = "sa-east-1", Region = "South America", Location = "São Paulo" } },
                        { "us-gov-east-1", new CloudRegion { Cloud = "AWS", RegionId = "us-gov-east-1", Region = "AWS GovCloud", Location = "US-East" } },
                        { "us-gov-west-1", new CloudRegion { Cloud = "AWS", RegionId = "us-gov-west-1", Region = "AWS GovCloud", Location = "US" } },

                        // AWS GLOBAL means edge locations
                        { "GLOBAL", new CloudRegion { Cloud = "AWS", RegionId = "GLOBAL", Region = "GLOBAL", Location = "Edge locations" } }
                    };

                    // AliCloud
                    regionNames.Add("alicloud", new CloudRegion { Cloud = "AliCloud", RegionId = string.Empty, Region = string.Empty });
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
            string aliCloudIpFilePath = $@"{this.dataFilePath}\Data\IpRangeFiles\AliCloud\{this.aliCloudIpFile}";
            string[] lines = File.ReadAllLines(aliCloudIpFilePath);
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
            IPAddress[] ipAddresses;
            try
            {
                ipAddresses = Dns.GetHostAddresses(ipOrUrl);
            }
            catch (Exception)
            {
                // Can not resolve host name, return null at this case.
                return result;
            }

            var ipAddress = ipAddresses[0];
            result.IpAddress = ipAddress.ToString();
            foreach (var net in Subnets.Keys)
            {
                if (net.Contains(ipAddress))
                {
                    var regionAlias = Subnets[net];
                    result.Cloud = RegionNames[regionAlias].Cloud;
                    result.RegionId = RegionNames[regionAlias].RegionId;
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
                        if (IPNetwork.TryParse(subnet, out IPNetwork net))
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
                if (IPNetwork.TryParse(prefix.IpPrefix, out IPNetwork net))
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
                if (IPNetwork.TryParse(line, out IPNetwork net))
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