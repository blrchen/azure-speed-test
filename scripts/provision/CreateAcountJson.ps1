# Important: these commands only work if you have logged into your Azure account
# 1. Connect-AzAccount
# 2. Select-AzSubscription -SubscriptionName "Your sub name"

$locations = Get-AzLocation
$resourceGroupName = "AzureSpeedRG"

IF (!(Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name $resourceGroupName -Location "West US"
}

foreach ($location in $locations) {
    $locationId = $location.Location
    # Note: storage name length can not exceed 24 
    $storageAccountName = "ast" + $locationId
    $storageAccountKey = (Get-AzStorageAccountKey -Name $storageAccountName -ResourceGroupName $resourceGroupName).Value[0]

    # This output can be used for generating outputs.json file
    $filePath = "settings.json"
    $storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName -ErrorAction Ignore
    if ($storageAccount) {
        "{" | Out-File -filePath $filePath -append -encoding utf8
        "  `"name`": `"$storageAccountName`"," |Out-File -filePath $filePath -append -encoding utf8
        "  `"key`": `"$storageAccountKey`"," | Out-File -filePath $filePath -append -encoding utf8
        "  `"locationId`": `"$locationId`"" | Out-File -filePath $filePath -append -encoding utf8
        "}," | Out-File -filePath $filePath -append -encoding utf8
    }
}