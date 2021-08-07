# This script create storage account policy which deletes blob files has creation time longer than 24 hours ago
# Important: these commands only work if you have logged into your Azure account
# 1. Connect-AzAccount (or Connect-AzAccount -EnvironmentName "AzureChinaCloud")
# 2. Select-AzSubscription -SubscriptionName "Your sub name"


$resourceGroupName = "azure-speed-test"
$storageAccountPrefix = "a1"

$locations = Get-AzLocation

foreach ($location in $locations) {
    $locationId = $location.Location
    $storageAccountName = $storageAccountPrefix + $locationId
    $storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName -ErrorAction Ignore
    if ($storageAccount) {
        Write-Host "Successfully fetch storage account details for $storageAccountName, processing rule"

        $action = Add-AzStorageAccountManagementPolicyAction -BaseBlobAction Delete -daysAfterModificationGreaterThan 1
        $filter = New-AzStorageAccountManagementPolicyFilter -PrefixMatch "upload"
        $rule = New-AzStorageAccountManagementPolicyRule -Name "DeleteLongerThan24Hours" -Action $action -Filter $filter
        Set-AzStorageAccountManagementPolicy -ResourceGroupName $resourceGroupName -StorageAccountName $storageAccountName -Rule $rule
    }
    else {
        Write-Error "Storage account not found, current subscription might not have access to region $locationId"
    }
}