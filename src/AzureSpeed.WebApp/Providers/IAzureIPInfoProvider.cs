using System.Threading.Tasks;
using AzureSpeed.WebApp.Contracts;

namespace AzureSpeed.WebApp.Providers
{
    public interface IAzureIPInfoProvider
    {
        Task<AzureIPInfo> GetAzureIPInfo(string ipAddressOrUrl);
    }
}
