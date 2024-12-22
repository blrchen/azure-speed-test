# azure-speed-test

![License MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Stars](https://img.shields.io/github/stars/blrchen/azure-speed-test.svg)
![Forks](https://img.shields.io/github/forks/blrchen/azure-speed-test.svg)
![Issues](https://img.shields.io/github/issues/blrchen/azure-speed-test.svg)

Azure Speed Test Tool: Measure network latency, download, and upload speeds to Azure datacenters worldwide.

## Live Demo

Visit the live demo at [Azure Speed Test](https://www.azurespeed.com).

## Setting Up Your Local Development Environment

### Prerequisites

- .NET 8.0
- For Windows: Visual Studio 2022 with ASP.NET and web development workload.
- For Mac: Rider
- Azure Storage Account setup:
  - CORS must be enabled.
  - Create a public container (`access level = Blob`) named `public` and upload `latency-test.json`.
  - Create a private container (`access level = Private`) named `private` and upload a 100MB dummy file, which is downloadable from [here](https://www.azurespeed.com/Azure/Download).
  - Create an upload container (`access level = Private`) named `upload`.

### Backend Setup

1. Run `CreateSettingsJson.ps1` to generate `settings.json`, which will replace `src/AzureSpeed.WebApp/Data/settings.json`.
2. Open `AzureSpeed.sln` using Visual Studio 2022 or Rider.
3. Launch the `AzureSpeed.WebApp` project.

### Frontend Setup

For detailed instructions on setting up the frontend, please refer to the [README](ui/README.md) in the UI directory.

## Built With

- [Angular](https://github.com/angular/angular)
- [Application Insights JavaScript SDK](https://github.com/microsoft/ApplicationInsights-JS)
- [ASP.NET Core](https://github.com/dotnet/aspnetcore)
- [Azure IP Lookup](https://github.com/blrchen/azure-ip-lookup)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
- [Bootstrap](https://github.com/twbs/bootstrap)
- [Azure Catalog](https://github.com/blrchen/azure-catalog)
- [d3-shape](https://github.com/d3/d3-shape)
- [Font Awesome](https://github.com/FortAwesome/Font-Awesome)
- [ngx-charts](https://github.com/swimlane/ngx-charts)
