using System.Collections.Generic;
using System.Numerics;

namespace AzureSpeed.Common.Models.ViewModels
{
    public class IpRangeViewModel
    {
        public string Cloud { get; set; }

        public string Region { get; set; }

        public BigInteger TotalIpCount { get; set; }

        public List<string> Subnet { get; set; }
    }
}