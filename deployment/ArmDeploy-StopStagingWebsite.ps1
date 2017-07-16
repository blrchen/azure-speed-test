Select-AzureRmSubscription -SubscriptionId "8eaf4bf3-36ac-44f2-8f0a-87fc37036d30"

$DeploymentName="StopStagingWebsite-"+(Get-Date -Format "yyyyMMdd-hhmmss")
New-AzureRmResourceGroupDeployment -ResourceGroupName "azurespeed" `
    -Name $DeploymentName `
    -Mode Incremental `
    -TemplateFile "StopStagingWebsite-Template.json" `
    -TemplateParameterFile "StopStagingWebsite-Parameters.json"
