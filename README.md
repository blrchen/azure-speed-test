# azure-speed-test

[![licence badge]][licence]
[![stars badge]][stars]
[![forks badge]][forks]
[![issues badge]][issues]

Azure speed test tool. Test your network latency, download and upload speed to Azure datacenters around the world.

## Demo

* <https://www.azurespeed.com>

## Local development environment setup steps

1. Run **CreateSettingsJson.ps1** to provision Azure storage accounts and generate **settings.json** for backend.
2. Run **AzureSpeed.AdminConsole.exe**, this tool will take care of everything needs for bootstrapping an Azure storage account to run speed test
    * Enable CORS
    * Create containers
    * Upload latency-test.json used for latency test
    * Upload a 100MB dummy file for download speed test (File can be downloaded from <https://www.azurespeed.com/Azure/Download>)
3. Open **AzureSpeed.sln** in **Visual Studio 2019**
4. You are all set now, enjoy coding!

## If you are only interested with UI development work

See README [here](src/frontend/README.md), change environment.ts line 8, replace apiEndpoint from <https://localhost:5001> to <https://www.azurespeed.com> to avoid use local api service.

## Refresh region list after new region launches

1. Run **CreateSettingsJson.ps1** to refresh settings.json
2. Run **AzureSpeed.AdminConsole.exe** to bootstrap storage account for newly added region(s)

## Built on

* [Angular](https://github.com/angular/angular)
* [Application Insights JavaScript SDK](https://github.com/microsoft/ApplicationInsights-JS)
* [ASP.NET Core](https://github.com/dotnet/aspnetcore)
* [Azure IP Lookup](https://github.com/blrchen/azure-ip-lookup)
* [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
* [Bootstrap](https://github.com/twbs/bootstrap)
* [d3-shape](https://github.com/d3/d3-shape)
* [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
* [ngx-charts](https://github.com/swimlane/ngx-charts)
* [RxJS](https://github.com/reactivex/rxjs)

## License

[MIT](/LICENSE)

[licence badge]:https://img.shields.io/badge/license-MIT-blue.svg
[stars badge]:https://img.shields.io/github/stars/blrchen/azure-speed-test.svg
[forks badge]:https://img.shields.io/github/forks/blrchen/azure-speed-test.svg
[issues badge]:https://img.shields.io/github/issues/blrchen/azure-speed-test.svg

[licence]:https://github.com/blrchen/azure-speed-test/blob/master/LICENSE
[stars]:https://github.com/blrchen/azure-speed-test/stargazers
[forks]:https://github.com/blrchen/azure-speed-test/network
[issues]:https://github.com/blrchen/azure-speed-test/issues
