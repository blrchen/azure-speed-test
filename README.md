
# AzureSpeed
[![licence badge]][licence]
[![stars badge]][stars]
[![forks badge]][forks]
[![issues badge]][issues]

Azure speed test tool. Test your network latency, download and upload speed to Azure datacenters around the world.

## Demo
* https://www.azurespeed.com

## Local development environment setup steps
1. Run CreateSettingsJson.ps1 to provision storage accounts and generate settings.json for backend.
1. Run **AzureSpeed.AdminConsole.exe**, this tool will take care of everything needs for bootstrapping an Azure storage account to run speed test
    * Enable CORS
    * Create containers
    * Create a callback.js used for latency test
    * Upload a 100MB dummy file for download speed test (File can be downloaded from https://www.azurespeed.com/Azure/Download)
2. Open **AzureSpeed.sln** in **Visual Studio 2019**
3. You are all set now, enjoy coding!

## If you are only interested with UI development work
See README [here](src/frontend/README.md), change environment.ts line 8, replace apiEndpoint from http://localhost:5000 to www.azurespeedc.com to avoid use local api service.

## Add a new region
1. Run CreateRegionsJson.ps1 to refresh regions.json used for frontend
2. Run CreateSettingsJson.ps1 to refresh settings.json
3. Run **AzureSpeed.AdminConsole.exe** to bootstrap storage account for newly added region(s)

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
