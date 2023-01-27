@echo off
SET ROOT=%~dp0
SET SRCROOT=%ROOT%src

@doskey build=dotnet build %SRCROOT%/AzureSpeed.sln
@doskey test=dotnet test %SRCROOT%/AzureSpeed.sln --logger trx -r %ROOT%/out/TestResults/ /p:CoverletOutput=$ROOT/out/TestResults/Reports/coverage.xml /p:CollectCoverage=true /p:CoverletOutputFormat=cobertura
@doskey publish=dotnet publish src/AzureSpeed.WebApp/AzureSpeed.WebApp.csproj -r win-x64 -c Release -p:PublishSingleFile=true --self-contained true --output %SRCROOT%/publish
@doskey vs=%SRCROOT%/AzureSpeed.sln
@doskey vscode=code %SRCROOT%/AzureSpeed.WebApp/ClientApp

echo Use command [93mbuild[0m to build the entire solution
echo Use command [93mtest[0m to run unit test
echo Use command [93mpublish[0m to create package for publishing
echo Use command [93mvs[0m to open source code with Visual Studio
echo Use command [93mvscode[0m to open source code with Visual Studio Code

echo Init completed