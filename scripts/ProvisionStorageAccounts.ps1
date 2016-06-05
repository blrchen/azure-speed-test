$locations = Get-AzureRmLocation
$resourceGroupName = "AzureSpeed"

IF(!(Get-AzureRmResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)){
	New-AzureRmResourceGroup -Name $resourceGroupName -Location "West US"
}

foreach ($location in $locations)
{
    $region = $location.DisplayName
    # Note: storage name length can not exceed 24 
    $storageAccountName = "azspd" + $location.Location

    # TODO: Switch to -Kind BlobStorage -AccessTier Hot when v2 storage is ready in all regions
    New-AzureRMStorageAccount -Name $storageAccountName -SkuName Standard_LRS -Kind Storage -Location $region -ResourceGroupName $resourceGroupName | Out-Null
    $storageAccountKey = (Get-AzureRmStorageAccountKey -Name $storageAccountName -ResourceGroupName $resourceGroupName).Value[0]
   
    Write-Host "{"
    Write-Host "Name: '$storageAccountName',"
    Write-Host "Key: '$storageAccountKey',"
    Write-Host "Region: '$region'"
    Write-Host "},"
    
}