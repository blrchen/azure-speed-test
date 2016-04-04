namespace AzureSpeed.WebUI
{
    using System.Collections.Generic;
    using System.Configuration;
    using System.IO;
    using System.Web.Script.Serialization;
    using System.Xml;
    using LukeSkywalker.IPNetwork;

    public static class SubnetBuilder
    {
        private static volatile IDictionary<IPNetwork, string> _subnetDictionary;
        private static readonly object _locker = new object();

        public static IDictionary<IPNetwork, string> GetSubnetDictionary(string ipFilePath)
        {
            if (_subnetDictionary == null)
            {
                lock (_locker)
                {
                    if (_subnetDictionary == null)
                    {
                        _subnetDictionary = CreateSubnetDictionary(ipFilePath);
                    }
                }
            }
            return _subnetDictionary;
        }

        private static IDictionary<IPNetwork, string> CreateSubnetDictionary(string ipFilePath)
        {
            var subnets = new Dictionary<IPNetwork, string>();
            string ipFileList = ConfigurationManager.AppSettings["AzureIpRangeFileList"];

            // Load Azure ip range data
            foreach (string filePath in ipFileList.Split(';'))
            {
                var xmlDoc = new XmlDocument();
                xmlDoc.Load(ipFilePath + @"\IpRangeFiles\Azure\" + filePath);
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
            string awsIpFile = ConfigurationManager.AppSettings["AwsIpRangeFile"];
            string json = File.ReadAllText(ipFilePath + @"\IpRangeFiles\AWS\" + awsIpFile);
            var jsSerializer = new JavaScriptSerializer();
            var awsIpRangeData = jsSerializer.Deserialize<AwsIpRangeData>(json);
            foreach (var prefix in awsIpRangeData.prefixes)
            {
                IPNetwork net;
                if (IPNetwork.TryParse(prefix.ip_prefix, out net))
                {
                    if (!subnets.ContainsKey(net))
                    {
                        subnets.Add(net, prefix.region);
                    }
                }
            }

            // Get AliCloud ip range data
            string aliCloudIpFile = ConfigurationManager.AppSettings["AliCloudIpRangeFile"];
            string[] lines = File.ReadAllLines(ipFilePath + @"\IpRangeFiles\AliCloud\" + aliCloudIpFile);
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