@echo off
msbuild AzureSpeed.sln /p:DeployOnBuild=true /p:PublishProfile=azurespeedeastasia.pubxml /p:Configuration=Release
msbuild AzureSpeed.sln /p:DeployOnBuild=true /p:PublishProfile=azurespeedwestus.pubxml /p:Configuration=Release
msbuild AzureSpeed.sln /p:DeployOnBuild=true /p:PublishProfile=azurespeedchinaeast.pubxml /p:Configuration=Release
