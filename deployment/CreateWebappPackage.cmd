@echo off

REM Script to create package for Azure web app deployment
REM https://github.com/vijayrkn/ASPNetPublishSamples/blob/bff9f78d796668dc07d5e28a8b93531caade839c/Publish.cmd#L128-L131

set WebAppProjectFile="..\..\AzureSpeed.Web.App\AzureSpeed.Web.App.csproj"
set PackageLocation="C:\DelMe\AzureSpeedPublishOutput"
set DesktopBuildPackageLocation="C:\DelMe\AzureSpeedPublishOutput\AzureSpeed.Web.App.zip"
msbuild %WebAppProjectFile% /p:PackageLocation=%PackageLocation% /p:DeployOnBuild=true /p:Configuration=Release /p:WebPublishMethod=Package /p:DeployTarget=WebPublish /p:PackageAsSingleFile=true /p:DeployIisAppPath="Default Web Site" /p:SolutionDir="." /p:DesktopBuildPackageLocation=%DesktopBuildPackageLocation%


