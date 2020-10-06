using System;
using System.Net;

namespace AzureSpeed.WebApp.Utils
{
    public static class Utils
    {
        public static string ConvertToIPAddress(string ipAddressOrUrl)
        {
            if (string.IsNullOrEmpty(ipAddressOrUrl))
            {
                throw new Exception("ipAddressOrUrl can not be null");
            }

            if (!(ipAddressOrUrl.StartsWith("http://") || ipAddressOrUrl.StartsWith("https://")))
            {
                ipAddressOrUrl = "http://" + ipAddressOrUrl;
            }

            var tmpUri = new Uri(ipAddressOrUrl);
            ipAddressOrUrl = tmpUri.Host;
            var ipAddresses = Dns.GetHostAddresses(ipAddressOrUrl);

            var ipAddress = ipAddresses[0];
            return ipAddress.ToString();
        }
    }
}
