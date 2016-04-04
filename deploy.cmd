@echo off
REM msbuild AzureSpeed.sln /p:VisualStudioVersion=14.0 /p:DeployOnBuild=true /p:PublishProfile=azurespeedeastasia.pubxml /p:Configuration=Release
msbuild AzureSpeed.sln /p:VisualStudioVersion=14.0 /p:DeployOnBuild=true /p:PublishProfile=azurespeedwestus.pubxml /p:Configuration=Release
msbuild AzureSpeed.sln /p:VisualStudioVersion=14.0 /p:DeployOnBuild=true /p:PublishProfile=azurespeedchinaeast.pubxml /p:Configuration=Release
