
# AzureSpeed
[![licence badge]][licence]
[![stars badge]][stars]
[![forks badge]][forks]
[![issues badge]][issues]

Azure speed test tool. Test your network latency, download and upload speed to Azure datacenters around the world.

## Demo
* Frontend - http://www.azurespeed.com, or https://azurespeed-ui-wus.azurewebsites.net (with SSL)
* Backend - http://www.azurespeed.com, or https://azurespeed-api-wus.azurewebsites.net (with SSL)

## Frontend setup steps
See README [here](src/frontend/README.md)

## Backend setup steps
1. Open PowerShell prompt and go to **scripts\provision** folder, run **ProvisionStorageAccounts.ps1**, this will provision Azure storage accounts in every regions in target subscription.
2. Run CreateCommonJson.ps1 and replace **src\backend\AzureSpeed.Web.App\Data\settings.json** with outputed **common.json** file
3. Run **AzureSpeed.AdminConsole.exe** to initialize storage accounts, this tool will take care of everything needs for a storage account to run speed test
    * Enable CORS
    * Create containers
    * Create a callback.js used for latency test
    * Upload a 100MB dummy file for download speed test (Test file can be downloaded from http://www.azurespeed.com/Azure/Download)
4. Open **AzureSpeed.sln** in **Visual Studio 2019**
5. Updated below files with storage accounts created in step #1
    - **src\backend\AzureSpeed.Web.App\wwwroot\js\azurespeed\common.js**
6. You are all set now, enjoy coding!

## Add a new region
1. Run CreateSettingsJson.ps1
2. Run CreateCommonJson.ps1

## Built on
* [Angular](https://github.com/angular/angular)
* [Application Insights JavaScript SDK](https://github.com/microsoft/ApplicationInsights-JS)
* [ASP.NET Core](https://github.com/aspnet/home)
* [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
* [Bootstrap](https://github.com/twbs/bootstrap)
* [d3-shape](https://github.com/d3/d3-shape)
* [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
* [ngx-charts](https://github.com/swimlane/ngx-charts)
* [RxJS](https://github.com/reactivex/rxjs)

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
