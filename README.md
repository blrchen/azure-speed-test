# AzureSpeed
[![licence badge]][licence]
[![stars badge]][stars]
[![forks badge]][forks]
[![issues badge]][issues]

Azure speed test tool. Test your network latency and speed to Azure datacenters around the world.

## Demo
* Staging - http://azurespeed-wus-staging.azurewebsites.net/
* Production - http://www.azurespeed.com

## Setup local develop environment
To run the code locally you will need:
* Visual Studio 2017.3 or higher
* An Azure subscription

Steps
1. Run ProvisionStorageAccounts.ps1 in PowerShell commnad line window to create Azure storage accounts.
2. Update **AzureSpeed.Web.App\Data\settings.json** with storage accounts and keys created in step #1
3. Run AzureSpeed.AdminConsole.exe to initialize storage accounts, this tool will take care of everything needs for a storage account to run speed test
    * Enable CORS
    * Create a callback.js used for latency test
    * Upload a 100MB dummy file for download speed test (Test file can be downloaded from http://www.azurespeed.com/Azure/Download)
5. Open **AzureSpeed.sln** in **Visual Studio 2017**
6. Updated below files with storage accounts created in step #1
    - **AzureSpeed.Web.App\wwwroot\js\azurespeed\common.js** 
    - **AzureSpeed.Web.App\wwwroot\js\azurespeed\controllers\MainController.js**
6. You are all set now, enjoy coding!

## Built on
* [ASP.NET Core](https://github.com/aspnet/home)
* [Bootstrap](https://github.com/twbs/bootstrap)
* [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
* [jQuery](https://github.com/jquery/jquery)
* [Angular](https://github.com/angular/angular)
* [UI Bootstrap](https://github.com/angular-ui/bootstrap)
* [Angular-filter](https://github.com/a8m/angular-filter)
* [checklist-model](https://github.com/vitalets/checklist-model)
* [D3](https://github.com/mbostock/d3)
* [SB Admin 2 Theme](https://github.com/blackrockdigital/startbootstrap-sb-admin-2/)
* [jazure](https://github.com/orcame/jazure)

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
