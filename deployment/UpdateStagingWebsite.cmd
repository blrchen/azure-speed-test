@echo off
msbuild ..\..\AzureSpeed.sln /p:DeployOnBuild=true /p:PublishProfile=azurespeed-wus-staging.pubxml /p:Configuration=Release
