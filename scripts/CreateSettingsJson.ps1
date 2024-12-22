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
# 1. Connect-AzAccount -TenantId "Your tenant id" (or Connect-AzAccount -EnvironmentName "AzureChinaCloud")
# 2. Select-AzSubscription -SubscriptionName "Your sub name"

function GetAzureStorages {
    param (
        [string]$resourceGroupName = "azure-speed-test-blobs"
    )
    $storageJsonObjects = New-Object System.Collections.Generic.List[System.Object]

    if (!(Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
        Write-Error "Resource group $resourceGroupName not found"
    }
    else {
        $storageAccounts = Get-AzStorageAccount -ResourceGroupName $resourceGroupName

        foreach ($storageAccount in $storageAccounts) {
            $storageAccountName = $storageAccount.StorageAccountName
            $locationId = $storageAccount.Location
            $storageAccountKey = (Get-AzStorageAccountKey -Name $storageAccountName -ResourceGroupName $resourceGroupName).Value[0]

            $storageJsonObject = New-Object PSObject -Property @{
                name       = $storageAccountName
                key        = $storageAccountKey
                locationId = $locationId
            }
            $storageJsonObjects.Add($storageJsonObject)
            Write-Host "Successfully fetched storage account details for $storageAccountName"
        }
    }

    return $storageJsonObjects | Sort-Object locationId
}

function CreateSettingsJsonFile {
    param (
        [Parameter(Mandatory = $true)]
        [System.Collections.Generic.List[System.Object]]$storageJsonObjects,
        [string]$outFilePath = "..\api\AzureSpeed\Data\settings.json"
    )

    if (Test-Path $outFilePath) {
        Remove-Item $outFilePath
    }

    $settingsJson = @{
        accounts = $storageJsonObjects
    }

    $settingsJson | ConvertTo-Json -Depth 100 -Compress:$false | Out-File -Encoding utf8 -FilePath $outFilePath
}

$storageJsonObjects = GetAzureStorages
CreateSettingsJsonFile -storageJsonObjects $storageJsonObjects