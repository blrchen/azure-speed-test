# AzureSpeed
[![licence badge]][licence]
[![stars badge]][stars]
[![forks badge]][forks]
[![issues badge]][issues]

Azure speed test tool. Test your network latency and speed to Azure datacenters around the world.

## Demo
http://www.azurespeed.com

## Development
1. Open **AzureSpeed.sln** in **Visual Studio 2017**
2. Run ProvisionStorageAccounts.ps1 in PowerShell commnad line window to create Azure storage accounts.
3. Replace storage accounts and keys in **AzureSpeed.Web.App\Data\settings.json**
4. Run AdminConsole.exe to initialize storage account, this tool will take care of everything needs for a storage account to run speed test
    1. Enable CORS
    2. Create two containers
    3. Create a callback.js which is used for latency test
    4. Upload a 100MB dummy file for download speed test (Test file can be downloaded from http://azurespeed.com/Azure/Download)
5. Replace storage account names in 
    - **AzureSpeed.Web.App\wwwroot\js\azurespeed\common.js** 
    - **AzureSpeed.Web.App\wwwroot\js\azurespeed\controllers\MainController.js**
6. You are all set now, enjoy coding!

## Built on
- [ASP.NET Core](https://github.com/aspnet/home)
- [Bootstrap](https://github.com/twbs/bootstrap)
- [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
- [jQuery](https://github.com/jquery/jquery)
- [Angular](https://github.com/angular/angular)
- [UI Bootstrap](https://github.com/angular-ui/bootstrap)
- [Angular-filter](https://github.com/a8m/angular-filter)
- [checklist-model](https://github.com/vitalets/checklist-model)
- [D3](https://github.com/mbostock/d3)
- [SB Admin 2 Theme](https://github.com/blackrockdigital/startbootstrap-sb-admin-2/)
- [jazure](https://github.com/orcame/jazure)

## License
[MIT](/LICENSE)

[licence badge]:https://img.shields.io/badge/license-MIT-blue.svg
[stars badge]:https://img.shields.io/github/stars/blrchen/AzureSpeed.svg
[forks badge]:https://img.shields.io/github/forks/blrchen/AzureSpeed.svg
[issues badge]:https://img.shields.io/github/issues/blrchen/AzureSpeed.svg

[licence]:https://github.com/blrchen/AzureSpeed/blob/master/LICENSE
[stars]:https://github.com/blrchen/AzureSpeed/stargazers
[forks]:https://github.com/blrchen/AzureSpeed/network
[issues]:https://github.com/blrchen/AzureSpeed/issues
