using System.Threading.Tasks;
using AzureSpeed.ApiService.Contracts;

namespace AzureSpeed.ApiService.Providers
{
    public interface IAzureIPInfoProvider
    {
        Task<AzureIPInfo> GetAzureIPInfo(string ipAddressOrUrl);
    }
}
