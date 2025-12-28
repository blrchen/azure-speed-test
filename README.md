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
- Node.js 22
- Azure Storage Account setup:
  - CORS must be enabled.
  - Create a public container (`access level = Blob`) named `public` and upload `latency-test.json`.
  - Create a private container (`access level = Private`) named `private` and upload a 100MB dummy file, which is downloadable from [here](https://www.azurespeed.com/Azure/Download).
  - Create an upload container (`access level = Private`) named `upload`.

### Backend Setup

1. Update storage account name and keys in `api/AzureSpeed/Data/settings.json`.
2. Open `api/AzureSpeed.sln` using Visual Studio.
3. Launch the `AzureSpeed` project.

### Frontend Setup

For detailed instructions on setting up the frontend, please refer to the [README](ui/README.md) in the UI directory.

## Built With

- [Angular](https://github.com/angular/angular)
- [ASP.NET Core](https://github.com/dotnet/aspnetcore)
- [Azure IP Lookup](https://github.com/blrchen/azure-ip-lookup)
- [Azure SDK for JavaScript](https://github.com/Azure/azure-sdk-for-js)
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)