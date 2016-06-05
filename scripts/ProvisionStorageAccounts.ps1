$locations = Get-AzureRmLocation
$resourceGroupName = "Blair-Storage-RG1"

IF(!(Get-AzureRmResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)){
	New-AzureRmResourceGroup -Name $resourceGroupName -Location "West US"
}

foreach ($location in $locations)
{
    $region = $location.DisplayName
    $storageAccountName = "blair212" + $location.Location

    # TODO: Switch to -Kind BlobStorage -AccessTier Hot when v2 storage is ready in all regions
    New-AzureRMStorageAccount -Name $storageAccountName -SkuName Standard_LRS -Kind Storage -Location $region -ResourceGroupName $resourceGroupName | Out-Null
    $storageAccountKey = (Get-AzureRmStorageAccountKey -Name $storageAccountName -ResourceGroupName $resourceGroupName).Value[0]
   
    Write-Host "{"
    Write-Host "Name: '$storageAccountName',"
    Write-Host "Key: '$storageAccountKey',"
    Write-Host "Region: '$region'"
    Write-Host "},"
    
}