# This script generates settings.json with following format, used by backend code
# {
#     "accounts": [
#       {
#         "name": "storage1",
#         "key": "key1",
#         "locationId": "eastasia"
#       },
#       ...
#     ]
# }

# Important: these commands only work if you have logged into your Azure account
# 1. Connect-AzAccount (or Connect-AzAccount -EnvironmentName "AzureChinaCloud")
# 2. Select-AzSubscription -SubscriptionName "Your sub name"

function GetAzureStorages() {
    $resourceGroupName = "AzureSpeedRG"
    $storageJsonObjects = New-Object System.Collections.Generic.List[System.Object];

    if (!(Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
        New-AzResourceGroup -Name $resourceGroupName -Location "West US"
    }

    $locations = Get-AzLocation
    foreach ($location in $locations) {
        $locationId = $location.Location
        # Note: storage name length can not exceed 24
        $storageAccountName = "ast" + $locationId
        
        if ((Get-AzStorageAccountNameAvailability -Name $storageAccountName).NameAvailable) {
            Write-Host "Provisioning storage account $storageAccountName in location $locationId"
            New-AzStorageAccount -ResourceGroupName $resourceGroupName `
                -Name $storageAccountName `
                -Location $locationId `
                -SkuName 'Standard_LRS' `
                -Kind StorageV2
        }
    
        $storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName -ErrorAction Ignore
        if ($storageAccount) {
            $storageAccountKey = (Get-AzStorageAccountKey -Name $storageAccountName -ResourceGroupName $resourceGroupName).Value[0]
    
            $storageJsonObject = [PSCustomObject]@{
                name       = $storageAccountName
                key        = $storageAccountKey
                locationId = $locationId
            }
            $storageJsonObjects.Add($storageJsonObject)
            Write-Host "Successfully fetch storage account details for $storageAccountName"
        }
        else {
            Write-Error "Storage account $storageAccountName not provisioned successfully"
        }
    }

    return $storageJsonObjects
}

function CreateSettingsJsonFile ($storageJsonObjects) {
    $outFilePath = "..\..\src\AzureSpeed.WebApp\Data\settings.json"
    if (Test-Path $outFilePath) {
        Remove-Item $outFilePath
    }

    "{" | Out-File -filePath $outFilePath -append -encoding utf8
    "  `"accounts`": [" | Out-File -filePath $outFilePath -append -encoding utf8
    foreach ($s in $storageJsonObjects) {
        # Append storage account metadata to seetings.json file
        "    {" | Out-File -filePath $outFilePath -append -encoding utf8
        "      `"name`": `"$($s.name)`"," | Out-File -filePath $outFilePath -append -encoding utf8
        "      `"key`": `"$($s.key)`"," | Out-File -filePath $outFilePath -append -encoding utf8
        "      `"locationId`": `"$($s.locationId)`"" | Out-File -filePath $outFilePath -append -encoding utf8
        "    }," | Out-File -filePath $outFilePath -append -encoding utf8
    }
    "  ]" | Out-File -filePath $outFilePath -append -encoding utf8
    "}" | Out-File -filePath $outFilePath -append -encoding utf8
}

$storageJsonObjects = GetAzureStorages
CreateSettingsJsonFile($storageJsonObjects)
