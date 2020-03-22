using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Xml;
using AzureSpeed.Common.Contracts;
using AzureSpeed.Common.Models;
using AzureSpeed.Common.Storage;
using Newtonsoft.Json;

namespace AzureSpeed.Common.LocalData
{
    public class LocalDataStoreContext
    {
        private readonly string dataFilePath;
        private Dictionary<string, CloudRegion> regionNames;
        private IDictionary<IPNetwork, string> subnetDictionary;
        private IEnumerable<StorageAccount> accounts;

        public LocalDataStoreContext(string dataPath)
        {
            this.dataFilePath = dataPath;
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
                    };
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

        public List<IPRangeInfo> GetIpRange()
        {
            var result = new List<IPRangeInfo>();

            string ipFileList = AzureSpeedConstants.AzureIpRangeFileList;
            foreach (string filePath in ipFileList.Split(';'))
            {
                var xmlDoc = new XmlDocument();
                xmlDoc.Load(this.dataFilePath + @"\Data\IpRangeFiles\Azure\" + filePath);
                var root = xmlDoc.DocumentElement;
                foreach (XmlElement ele in root)
                {
                    string region = ele.GetAttribute("Name");
                    var ipRange = new IPRangeInfo { Cloud = "Azure", Region = region, Subnet = new List<string>() };
                    foreach (XmlElement xe in ele)
                    {
                        string subnet = xe.GetAttribute("Subnet");
                        ipRange.Subnet.Add(subnet);
                        ipRange.TotalIpCount += IPNetwork.Parse(subnet).Total;
                    }

                    result.Add(ipRange);
                }
            }

            return result;
        }

        public RegionInfo GetRegionInfo(string ipAddressOrUrl)
        {
            string ipAddress = Utils.ConvertToIPAddress(ipAddressOrUrl);
            var result = new RegionInfo() { IPAddress = ipAddress };
            foreach (var net in Subnets.Keys)
            {
                if (net.Contains(IPAddress.Parse(ipAddress)))
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

            foreach (string filePath in AzureSpeedConstants.AzureIpRangeFileList.Split(';'))
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

            return subnets;
        }
    }
}