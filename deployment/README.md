## Deployment
1. Run CreateWebppPackage.cmd to generate zip package file for deployment
2. Upload zip package file to blob storage
3. Run ArdDeploy.ps1 to deploy to Azure staing webapp. (Run Login-AzureRMAccount first)

## Reference
https://docs.microsoft.com/en-us/azure/app-service-web/app-service-web-arm-with-msdeploy-provision