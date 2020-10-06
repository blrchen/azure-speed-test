using System.Collections.Generic;
using System.Numerics;

namespace AzureSpeed.WebApp.Contracts
{
    public class AzureIPRangeInfo
    {
        public string Cloud { get; set; }

        public string Region { get; set; }

        public BigInteger TotalIpCount { get; set; }

        public string TotalIp { get; set; }

        public List<string> Subnet { get; set; }
    }
}