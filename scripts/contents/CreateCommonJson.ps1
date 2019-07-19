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
#  - Key is generated from Get-AzLocation | Sort-Object "Location" | Select-Object "Location"
#  - Location information comes from https://azure.microsoft.com/en-us/global-infrastructure/locations/
#  - Regions comes from public ip xml file, it seems location and regions mapping is one to many
$locationHashtable = @{
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
    brazilsouth        = @{
        location          = "Sao Paulo State"
        geography         = "Brazil"
        geographyGrouping = "Americas"
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
    centralindia       = @{
        location          = "Pune"
        geography         = "India"
        geographyGrouping = "Asia Pacific"
    }
    centralus          = @{
        location          = "Iowa"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    eastasia           = @{
        location          = "Hong Kong"
        geography         = "Asia Pacific"
        geographyGrouping = "Asia Pacific"
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
    japaneast          = @{
        location          = "Tokyo, Saitama"
        geography         = "Japan"
        geographyGrouping = "Asia Pacific"
    }
    japanwest          = @{
        location          = "Osaka"
        geography         = "Japan"
        geographyGrouping = "Asia Pacific"
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
    northcentralus     = @{
        location          = "Illinois"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    northeurope        = @{
        location          = "Ireland"
        geography         = "Europe"
        geographyGrouping = "Europe"
    }
    southafricanorth   = @{
        location          = "Johannesburg"
        geography         = "South Africa"
        geographyGrouping = "Middle East and Africa"
    }
    southafricawest   = @{
        location          = "Cape Town"
        geography         = "South Africa"
        geographyGrouping = "Middle East and Africa"
    }
    southcentralus     = @{
        location          = "Texas"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    southeastasia      = @{
        location          = "Singapore"
        geography         = "Asia Pacific"
        geographyGrouping = "Asia Pacific"
    }
    southindia         = @{
        location          = "Chennai"
        geography         = "India"
        geographyGrouping = "Asia Pacific"
    }
    uaecentral         = @{
        location          = "Abu Dhabi"
        geography         = "UAE"
        geographyGrouping = "Middle East and Africa"
    }
    uaenorth         = @{
        location          = "Dubai"
        geography         = "UAE"
        geographyGrouping = "Middle East and Africa"
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
    westeurope         = @{
        location          = "Netherlands"
        geography         = "Europe"
        geographyGrouping = "Europe"
    }
    westindia          = @{
        location          = "Mumbai"
        geography         = "India"
        geographyGrouping = "Asia Pacific"
    }
    westus             = @{
        location          = "California"
        geography         = "United States"
        geographyGrouping = "Americas"
    }
    westus2            = @{
        location          = "Washington"
        geography         = "United States"
        geographyGrouping = "Americas"
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
