## Deployment

### Deploy with msbuild
Open Visual Studio Developer Command Prompt and run UpdateStagingWebsite.cmd

### Deploy with ARM template
This is recommended by Microsoft but a bit overhead for such a small project. The step can work but is not fully automated, for example step 2 is manual.
1. Run CreateWebppPackage.cmd to generate zip package file for deployment
2. Upload zip package file to blob storage
3. Open PowerShell command, Run Login-AzureRMAccount to login first and then run ArdDeploy.ps1.

### Reference
https://docs.microsoft.com/en-us/azure/app-service-web/app-service-web-arm-with-msdeploy-provision