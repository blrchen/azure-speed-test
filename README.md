# AzureSpeed
[![licence badge]][licence]
[![stars badge]][stars]
[![forks badge]][forks]
[![issues badge]][issues]

Azure speed test tool. Test your network latency and speed to Azure datacenters around the world.

## Demo
* Production - http://www.azurespeed.com, or https://azurespeed-wus.azurewebsites.net with SSL
* Staging - https://azurespeed-wus-staging.azurewebsites.net

## Setup local development environment
To run the code locally you will need:
* Visual Studio 2019
* Azure storage accounts for speed testing

### Steps
1. Open a command line window, go to src\AzureSpeed.Web.App, run **npm install**
2. Open PowerShell prompt and go to scripts\provision folder, run ProvisionStorageAccounts.ps1, this will provision Azure storage accounts in every regions in target subscription.
3. Run CreateCommonJson.ps1 and replace **AzureSpeed.Web.App\Data\settings.json** with outputed **common.json** file
4. Run AzureSpeed.AdminConsole.exe to initialize storage accounts, this tool will take care of everything needs for a storage account to run speed test
    * Enable CORS
    * Create containers
    * Create a callback.js used for latency test
    * Upload a 100MB dummy file for download speed test (Test file can be downloaded from http://www.azurespeed.com/Azure/Download)
5. Open **AzureSpeed.sln** in **Visual Studio 2019**
6. Updated below files with storage accounts created in step #1
    - **AzureSpeed.Web.App\wwwroot\js\azurespeed\common.js**
7. You are all set now, enjoy coding!

## Add a new region
1. Run CreateSettingsJson.ps1
2. Run CreateCommonJson.ps1

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
