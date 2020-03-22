using System.Collections.Generic;
using System.Numerics;

namespace AzureSpeed.Common.Contracts
{
    public class IPRangeInfo
    {
        public string Cloud { get; set; }

        public string Region { get; set; }

        public BigInteger TotalIpCount { get; set; }

        public List<string> Subnet { get; set; }
    }
}