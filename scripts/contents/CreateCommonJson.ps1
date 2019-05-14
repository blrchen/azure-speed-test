# This script generates common.json with following format, used by frontend code

# Important: these commands only work if you have logged into your Azure account
# 1. Connect-AzAccount
# 2. Select-AzSubscription -SubscriptionName "Your sub name"

$locations = Get-AzLocation
$resourceGroupName = "AzureSpeedRG"

IF (!(Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue)) {
    New-AzResourceGroup -Name $resourceGroupName -Location "West US"
}

# This hashtable contains all metadata of azure locations.
#  - Key is generated from Get-AzLocation | select-object "Location"
#  - Location information comes from https://azure.microsoft.com/en-us/global-infrastructure/locations/
#  - Regions comes from public ip xml file, it seems location and regions mapping is one to many
$locationHashtable = @{
    eastasia           = @{
        location          = "Hong Kong"
        geography         = "Asia Pacific"
        geographyGrouping = "Asia Pacific"
    }
    southeastasia      = @{
        location          = "Singapore"
        geography         = "Asia Pacific"
        geographyGrouping = "Asia Pacific"
    }
    centralus          = @{
        location          = "Iowa"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    eastus             = @{
        location          = "Virginia"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    eastus2            = @{
        location          = "Virginia"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    westus             = @{
        location          = "California"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    northcentralus     = @{
        location          = "Illinois"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    southcentralus     = @{
        location          = "Texas"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    northeurope        = @{
        location          = "Ireland"
        geography         = "Europe"
        geographyGrouping = "Europe"
    }
    westeurope         = @{
        location          = "Netherlands"
        geography         = "Europe"
        geographyGrouping = "Europe"
    }
    japanwest          = @{
        location          = "Osaka"
        geography         = "Japan"
        geographyGrouping = "Asia Pacific"
    }
    japaneast          = @{
        location          = "Tokyo, Saitama"
        geography         = "Japan"
        geographyGrouping = "Asia Pacific"
    }
    brazilsouth        = @{
        location          = "Sao Paulo State"
        geography         = "Brazil"
        geographyGrouping = "Americas"
    }
    australiaeast      = @{
        location          = "New South Wales"
        geography         = "Australia"
        geographyGrouping = "Asia Pacific"
    }
    australiasoutheast = @{
        location          = "Victoria"
        geography         = "Australia"
        geographyGrouping = "Asia Pacific"
    }
    southindia         = @{
        location          = "Chennai"
        geography         = "India"
        geographyGrouping = "Asia Pacific"
    }
    centralindia       = @{
        location          = "Pune"
        geography         = "India"
        geographyGrouping = "Asia Pacific"
    }
    westindia          = @{
        location          = "Mumbai"
        geography         = "India"
        geographyGrouping = "Asia Pacific"
    }
    canadacentral      = @{
        location          = "Toronto"
        geography         = "Canada"
        geographyGrouping = "Americas"
    }
    canadaeast         = @{
        location          = "Quebec City"
        geography         = "Canada"
        geographyGrouping = "Americas"
    }
    uksouth            = @{
        location          = "London"
        geography         = "United Kingdom"
        geographyGrouping = "Europe"
    }
    ukwest             = @{
        location          = "Cardiff"
        geography         = "United Kingdom"
        geographyGrouping = "Europe"
    }
    westcentralus      = @{
        location          = "Wyoming"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    westus2            = @{
        location          = "Washington"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    koreacentral       = @{
        location          = "Seoul"
        geography         = "Korea"
        geographyGrouping = "Asia Pacific"
    }
    koreasouth         = @{
        location          = "Busan"
        geography         = "Korea"
        geographyGrouping = "Asia Pacific"
    }
    francecentral      = @{
        location          = "Paris"
        geography         = "France"
        geographyGrouping = "Europe"
    }
    francesouth        = @{
        location          = "Marseille"
        geography         = "France"
        geographyGrouping = "Europe"
    }
    australiacentral   = @{
        location          = "Canberra"
        geography         = "Australia"
        geographyGrouping = "Asia Pacific"
    }
    australiacentral2  = @{
        location          = "Canberra"
        geography         = "Australia"
        geographyGrouping = "Asia Pacific"
    }
    southafricanorth   = @{
        location          = "Johannesburg"
        geography         = "South Africa"
        geographyGrouping = "Middle East and Africa"
    }
}

$index = 0;
$regionList = New-Object System.Collections.Generic.List[System.Object];
foreach ($location in $locations) {
    $index++;

    $storageAccountName = "ast" + $location.Location
    $storageAccount = Get-AzStorageAccount -ResourceGroupName $resourceGroupName -Name $storageAccountName -ErrorAction Ignore

    # Skip those storage accounts not created successfully in current subscription.
    if ($storageAccount) {
        $regionObject = [PSCustomObject]@{
            id                 = $index
            locationId         = $location.Location
            name               = $location.DisplayName
            storageAccountName = $storageAccount.StorageAccountName
            location           = $locationHashtable[$location.Location].location
            geography          = $locationHashtable[$location.Location].geography
            geographyGrouping  = $locationHashtable[$location.Location].geographyGrouping
        }
        $regionList.Add($regionObject)
    }
}

$regionList | ConvertTo-Json | Out-File "common.json"
