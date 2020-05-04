$location = "West US"
$ResourceGroupName = "azurespeed-westus"
$AppServicePlanName = "azurespeed-serviceplan-wus"
$appName = "azurespeed-westus"
$domainName = "www.azurespeed.com"
  
$asp = Get-AzResource -Name $AppServicePlanName `
    -ResourceGroupName $ResourceGroupName `
    -ResourceType "Microsoft.Web/serverfarms"
$AppServicePlanId = $asp.ResourceId
  
$PropertiesObject = @{
    canonicalName = $domainName
    serverFarmId  = $AppServicePlanId
}

New-AzResource -Name $domainName -Location $location `
    -PropertyObject $PropertiesObject `
    -ResourceGroupName $ResourceGroupName `
    -ResourceType Microsoft.Web/certificates `
    -Force

$freeCert = Get-AzResource -ResourceName $domainName `
    -ResourceGroupName $ResourceGroupName `
    -ResourceType Microsoft.Web/certificates `

$freeCert

$freeCert.Properties.thumbprint

$PropertiesObject = @{
    SslState   = "SniEnabled"
    thumbprint = $freeCert.Properties.thumbprint
}

$certName = $appName + '/' + $domainName

New-AzResource -Name $certName -Location $location `
    -PropertyObject $PropertiesObject `
    -ResourceGroupName $ResourceGroupName `
    -ResourceType Microsoft.Web/sites/hostnameBindings `
    -Force