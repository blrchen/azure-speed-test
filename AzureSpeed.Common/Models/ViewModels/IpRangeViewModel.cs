using System.Collections.Generic;

namespace AzureSpeed.Common.Models.ViewModels
{
    public class IpRangeViewModel
    {
        public string Cloud { get; set; }

        public string Region { get; set; }

        public double TotalIpCount { get; set; }

        public List<string> Subnet { get; set; }
    }
}