using AzureSpeed.WebApp.Legacy.Contracts;

namespace AzureSpeed.WebApp.Providers
{
    public interface ILegacyAzureIPInfoProvider
    {
        LegacyAzureIPInfo GetRegionInfo(string ipAddressOrUrl);
    }
}
