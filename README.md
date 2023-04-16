# azure-speed-test

[![license badge]][license]
[![stars badge]][stars]
[![forks badge]][forks]
[![issues badge]][issues]

Azure Speed Test Tool: Measure network latency, download, and upload speeds to Azure datacenters worldwide.

## Live Demo

* <https://www.azurespeed.com>

## Local Development Environment Setup Steps

### Prerequisites

* .NET 6.0
* [Windows only] Visual Studio 2022 with ASP.NET and web development workload.
* [Mac only] Rider
* Azure Storage Accounts:
  * Enable CORS
  * Create a public container (access level = Blob) named `public` and upload latency-test.json.
  * Create a private container (access level = Private) named `private` and upload a 100MB dummy file (downloadable from <https://www.azurespeed.com/Azure/Download>).
  * Create an upload container (access level = Private) named `upload`.

### Setting Up Local Development Environment for Frontend & Backend

1. Run `CreateSettingsJson.ps1` to generate `settings.json`, then replace `src/AzureSpeed.WebApp/Data/settings.json` with it.
2. Open `AzureSpeed.sln` in **Visual Studio 2022** or **Rider**.
3. Launch the **AzureSpeed.WebApp** project, then open <https://localhost:5001> in your browser to view the locally running website.

### [Optional] Configuring Local Frontend Development Environment

The frontend connects to the backend API service at <https://localhost:5001> by default. To switch to a cloud API service for frontend development, update `apiEndpoint` in `environment.ts` from <https://localhost:5001> to <https://www.azurespeed.com>.

## Built on

* [Angular](https://github.com/angular/angular)
* [Application Insights JavaScript SDK](https://github.com/microsoft/ApplicationInsights-JS)
* [ASP.NET Core](https://github.com/dotnet/aspnetcore)
* [Azure IP Lookup](https://github.com/blrchen/azure-ip-lookup)
* [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
* [Bootstrap](https://github.com/twbs/bootstrap)
* [Cloud Catalog](https://github.com/blrchen/cloud-catalog)
* [d3-shape](https://github.com/d3/d3-shape)
* [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
* [ngx-charts](https://github.com/swimlane/ngx-charts)
* [RxJS](https://github.com/reactivex/rxjs)

[license badge]:https://img.shields.io/badge/license-MIT-blue.svg
[stars badge]:https://img.shields.io/github/stars/blrchen/azure-speed-test.svg
[forks badge]:https://img.shields.io/github/forks/blrchen/azure-speed-test.svg
[issues badge]:https://img.shields.io/github/issues/blrchen/azure-speed-test.svg

[license]:https://github.com/blrchen/azure-speed-test/blob/master/LICENSE
[stars]:https://github.com/blrchen/azure-speed-test/stargazers
[forks]:https://github.com/blrchen/azure-speed-test/network
[issues]:https://github.com/blrchen/azure-speed-test/issues
