Select-AzureRmSubscription -SubscriptionId "8eaf4bf3-36ac-44f2-8f0a-87fc37036d30"

$DeploymentName="CreateStagingWebsite-"+(Get-Date -Format "yyyyMMdd-hhmmss")
New-AzureRmResourceGroupDeployment -ResourceGroupName "AzureSpeed" `
    -Name $DeploymentName `
    -Mode Incremental `
    -TemplateFile "CreateStagingWebsite-Template.json" `
    -TemplateParameterFile "CreateStagingWebsite-Parameters.json"