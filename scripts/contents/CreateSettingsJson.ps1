# This script generates settings.json with following format, used by backend code
# {
#     "accounts": [
#       {
#         "name": "storage1",
#         "key": "key1",
#         "locationId": "eastasia"
#       },
#       {
#         "name": "storage1",
#         "key": "key2",
#         "locationId": "southeastasia"
#       }
#     ]
# }

# Important: these commands only work if you have logged into your Azure account
# 1. Connect-AzAccount
# 2. Select-AzSubscription -SubscriptionName "Your sub name"


$locations = Get-AzLocation
$resourceGroupName = "AzureSpeedRG"
$outFilePath = "settings.json"
if (Test-Path $outFilePath) 
{
  Remove-Item $outFilePath
}

if (!(Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name $resourceGroupName -Location "West US"
}

"{" | Out-File -filePath $outFilePath -append -encoding utf8
"  `"accounts`": ["| Out-File -filePath $outFilePath -append -encoding utf8

foreach ($location in $locations) {
    $locationId = $location.Location
    # Note: storage name length can not exceed 24 
    $storageAccountName = "ast" + $locationId
    $storageAccountKey = (Get-AzStorageAccountKey -Name $storageAccountName -ResourceGroupName $resourceGroupName).Value[0]

    # This output can be used for generating outputs.json file
    
    $storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName -ErrorAction Ignore
    if ($storageAccount) {
        "    {" | Out-File -filePath $outFilePath -append -encoding utf8
        "      `"name`": `"$storageAccountName`"," |Out-File -filePath $outFilePath -append -encoding utf8
        "      `"key`": `"$storageAccountKey`"," | Out-File -filePath $outFilePath -append -encoding utf8
        "      `"locationId`": `"$locationId`"" | Out-File -filePath $outFilePath -append -encoding utf8
        "    }," | Out-File -filePath $outFilePath -append -encoding utf8
    }
}

"  ]"| Out-File -filePath $outFilePath -append -encoding utf8
"}" | Out-File -filePath $outFilePath -append -encoding utf8