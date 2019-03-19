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
        regions  = "asiaeast"
        location = "Hong Kong"
        geoName  = "Asia Pacific"
    }
    southeastasia      = @{
        regions  = "asiasoutheast"
        location = "Singapore"
        geoName  = "Asia Pacific"
    }
    centralus          = @{
        regions  = "uscentral"
        location = "Iowa"
        geoName  = "Americas"
    }
    eastus             = @{
        regions  = "useast"
        location = "Virginia"
        geoName  = "Americas"
    }
    eastus2            = @{
        regions  = "useast2"
        location = "Virginia"
        geoName  = "Americas"
    }
    westus             = @{
        regions  = "uswest"
        location = "California"
        geoName  = "Americas"
    }
    northcentralus     = @{
        regions  = "usnorth"
        location = "Illinois"
        geoName  = "Americas"
    }
    southcentralus     = @{
        regions  = "ussouth"
        location = "Texas"
        geoName  = "Americas"
    }
    northeurope        = @{
        regions  = "europenorth"
        location = "Ireland"
        geoName  = "Europe"
    }
    westeurope         = @{
        regions  = "europewest"
        location = "Netherlands"
        geoName  = "Europe"
    }
    japanwest          = @{
        regions  = "japanwest"
        location = "Osaka"
        geoName  = "Asia Pacific"
    }
    japaneast          = @{
        regions  = "japaneast"
        location = "Tokyo, Saitama"
        geoName  = "Asia Pacific"
    }
    brazilsouth        = @{
        regions  = "brazilsouth"
        location = "Sao Paulo State"
        geoName  = "Americas"
    }
    australiaeast      = @{
        regions  = "australiaeast"
        location = "New South Wales"
        geoName  = "Asia Pacific"
    }
    australiasoutheast = @{
        regions  = "australiasoutheast"
        location = "Victoria" 
        geoName  = "Asia Pacific"
    }
    southindia         = @{
        regions  = "indiasouth"
        location = "Chennai"
        geoName  = "Asia Pacific"
    }
    centralindia       = @{
        regions  = "indiacentral"
        location = "Pune"
        geoName  = "Asia Pacific"
    }
    westindia          = @{
        regions  = "indiawest"
        location = "Mumbai"
        geoName  = "Asia Pacific"
    }
    canadacentral      = @{
        regions  = "canadacentral"
        location = "Toronto"
        geoName  = "Americas"
    }
    canadaeast         = @{
        regions  = "canadaeast"
        location = "Quebec City"
        geoName  = "Americas"
    }
    uksouth            = @{
        regions  = "uksouth"
        location = "London"
        geoName  = "Europe"
    }
    ukwest             = @{
        regions  = "ukwest"
        location = "Cardiff"
        geoName  = "Europe"
    }
    westcentralus      = @{
        regions  = "uswestcentral"
        location = "Wyoming"
        geoName  = "Americas"
    }
    westus2            = @{
        regions  = "uswest2"
        location = "Washington"
        geoName  = "Americas"
    }
    koreacentral       = @{
        regions  = "koreacentral"
        location = "Seoul"
        geoName  = "Asia Pacific"
    }
    koreasouth         = @{
        regions  = "koreasouth"
        location = "Busan"
        geoName  = "Asia Pacific"
    }
    francecentral      = @{
        regions  = "francec"
        location = "Paris"
        geoName  = "Europe"
    }
    francesouth        = @{
        regions  = "frances"
        location = "Marseille"
        geoName  = "Europe"
    }
    australiacentral   = @{
        regions  = "australiac"
        location = "Canberra"
        geoName  = "Asia Pacific"
    }
    australiacentral2  = @{
        regions  = "australiac2"
        location = "Canberra"
        geoName  = "Asia Pacific"
    }
    southafricanorth   = @{
        regions  = "southafrican"
        location = "Johannesburg"
        geoName  = "Middle East and Africa"
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
            regions            = $locationHashtable[$location.Location].regions
            location           = $locationHashtable[$location.Location].location
            geoName            = $locationHashtable[$location.Location].geoName
        }
        $regionList.Add($regionObject)
    }
}

$regionList | ConvertTo-Json | Out-File "common.json"
