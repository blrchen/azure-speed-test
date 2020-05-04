using AzureSpeed.ApiService.Legacy.Contracts;

namespace AzureSpeed.ApiService.Providers
{
    public interface ILegacyAzureIPInfoProvider
    {
        LegacyAzureIPInfo GetRegionInfo(string ipAddressOrUrl);
    }
}
