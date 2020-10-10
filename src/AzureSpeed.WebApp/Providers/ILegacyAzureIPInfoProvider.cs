using AzureSpeed.WebApp.Legacy.Contracts;

namespace AzureSpeed.WebApp.Providers
{
    public interface ILegacyAzureIPInfoProvider
    {
        LegacyAzureIPInfo GetLegacyAzureIPInfo(string ipAddressOrUrl);
    }
}
