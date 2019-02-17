# IMPORTANT: Run following prior to running this script
# 1. Connect-AzAccount
# 2. Select-AzSubscription -SubscriptionName "Your sub name"

$locations = Get-AzLocation
$resourceGroupName = "AzureSpeed"

IF (!(Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name $resourceGroupName -Location "West US"
}

foreach ($location in $locations) {
    $region = $location.DisplayName
    # Note: storage name length can not exceed 24 
    $storageAccountName = "spt" + $location.Location

    # Check storage account mane availability for creation
    # if (!(Get-AzStorageAccountNameAvailability -Name $storageAccountName).NameAvailable) {
    #     Write-Error "$storageAccountName not available for creation"
    # }

    # Create storage account in this region if it's not created yet.
    $storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName -ErrorAction Ignore
    if ($storageAccount) {
        # Write-Host "$storageAccountName exists, creation skipping...";
    }
    else {
        # Write-Host "$storageAccountName not exists, creating..."
        New-AzStorageAccount -ResourceGroupName $resourceGroupName `
            -Name $storageAccountName `
            -Location $region `
            -SkuName Standard_LRS `
            -Kind StorageV2 
    }

    $storageAccountKey = (Get-AzStorageAccountKey -Name $storageAccountName -ResourceGroupName $resourceGroupName).Value[0]

    # This output can be used for generating outputs.json file
    $filePath = "settings.json"
    $storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName -ErrorAction Ignore
    if ($storageAccount) {
        "{" | Out-File -filePath $filePath -append -encoding utf8
        "  `"name`": `"$storageAccountName`"," |Out-File -filePath $filePath -append -encoding utf8
        "  `"key`": `"$storageAccountKey`"," | Out-File -filePath $filePath -append -encoding utf8
        "  `"region`": `"$region`"" | Out-File -filePath $filePath -append -encoding utf8
        "}," | Out-File -filePath $filePath -append -encoding utf8
    }
}