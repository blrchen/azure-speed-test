# azure-speed-test

[![license badge]][license]
[![stars badge]][stars]
[![forks badge]][forks]
[![issues badge]][issues]

Azure speed test tool. Test your network latency, download and upload speed to Azure datacenters around the world.

## Demo

* <https://www.azurespeed.com>

## Local development environment setup steps

### Prerequisites

* .NET 6.0
* [For Windows only] Visual Studio 2022 with the ASP.NET and web development workload.
* [For Mac only] Rider
* Azure Storage Accounts
  * Enable CORS
  * Create container named public (access level = public blob) and upload latency-test.json
  * Create container named private (access level = no public) and upload 100MB dummy file (File can be downloaded from <https://www.azurespeed.com/Azure/Download>)
  * Create container named upload (access level =  no public)

### Steps to setup local development environment with both frontend and backend

By default, frontend talks to backend api service running on `https://localhost:5001`, you can replace `apiEndpoint` in `environment.ts` from `https://localhost:5001` to `https://www.azurespeed.com` to avoid use local api service, this is helpful for frontend only development.

1. Run `CreateSettingsJson.ps1` to generate `settings.json` and replace `src/AzureSpeed.WebApp/Data/settings.json` with it.
2. Open `AzureSpeed.sln` with **Visual Studio 2022** or **Rider**.
3. Launch **AzureSpeed.WebApp** project and then open <https://localhost:5001> in browser, you should see the website up and running locally.

### Steps to setup local development environment for frontend only

By default, frontend talks to backend api service running on <https://localhost:5001>, you can replace `apiEndpoint` in `environment.ts` from <https://localhost:5001> to <https://www.azurespeed.com> to avoid use local api service, this is helpful for frontend only development.

1. Open directory `src/AzureSpeed.WebApp/ClientApp` in Visual Studio Code
2. Run `npm install` to install all npm packages
3. Run `npm run start` to start frontend development server, you should see <http://localhost:4200> up and running locally, it will automatically reload if you change any of the source files.

## Built on

* [Angular](https://github.com/angular/angular)
* [Application Insights JavaScript SDK](https://github.com/microsoft/ApplicationInsights-JS)
* [ASP.NET Core](https://github.com/dotnet/aspnetcore)
* [Azure IP Lookup](https://github.com/blrchen/azure-ip-lookup)
* [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
* [Bootstrap](https://github.com/twbs/bootstrap)
* [Cloud Infrastructure](https://github.com/blrchen/cloud-infrastructure)
* [d3-shape](https://github.com/d3/d3-shape)
* [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
* [ngx-charts](https://github.com/swimlane/ngx-charts)
* [RxJS](https://github.com/reactivex/rxjs)

## License

[MIT](/LICENSE)

[license badge]:https://img.shields.io/badge/license-MIT-blue.svg
[stars badge]:https://img.shields.io/github/stars/blrchen/azure-speed-test.svg
[forks badge]:https://img.shields.io/github/forks/blrchen/azure-speed-test.svg
[issues badge]:https://img.shields.io/github/issues/blrchen/azure-speed-test.svg

[license]:https://github.com/blrchen/azure-speed-test/blob/master/LICENSE
[stars]:https://github.com/blrchen/azure-speed-test/stargazers
[forks]:https://github.com/blrchen/azure-speed-test/network
[issues]:https://github.com/blrchen/azure-speed-test/issues
