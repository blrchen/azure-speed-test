# Important: these commands only work if you have logged into your Azure account
# 1. Connect-AzAccount
# 2. Select-AzSubscription -SubscriptionName "Your sub name"

$locations = Get-AzLocation
$resourceGroupName = "AzureSpeedRG"

IF (!(Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name $resourceGroupName -Location "West US"
}

foreach ($location in $locations) {
    $region = $location.DisplayName
    # Note: storage name length can not exceed 24 
    $storageAccountName = "ast" + $location.Location

    # Create storage account in this region if it's not created yet.
    $storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName -ErrorAction Ignore
    if ($storageAccount) {
        Write-Host "$storageAccountName exists, storage account creation skipped...";
    }
    else {
        Write-Host "creating storage account $storageAccountName..."
        New-AzStorageAccount -ResourceGroupName $resourceGroupName `
            -Name $storageAccountName `
            -Location $region `
            -SkuName Standard_LRS `
            -Kind StorageV2 
    }
}