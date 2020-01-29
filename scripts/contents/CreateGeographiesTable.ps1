# This script generates static contents (html table) used for geographies page
# http://www.azurespeed.com/Information/AzureGeographies

# Important: these commands only work if you have logged into your Azure account
# 1. Connect-AzAccount (or Connect-AzAccount -EnvironmentName "AzureChinaCloud")
# 2. Select-AzSubscription -SubscriptionName "Your sub name"

$locations = Get-AzLocation

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
    germanynorth       = @{
        location          = "Berlin"
        geography         = "Germany"
        geographyGrouping = "Europe"
    }
    germanywestcentral = @{
        location          = "Frankfurt"
        geography         = "Germany"
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
    norwaywest            = @{
        location          = "Stavanger"
        geography         = "Europe"
        geographyGrouping = "Europe"
    }
    norwayeast            = @{
        location          = "Oslo"
        geography         = "Europe"
        geographyGrouping = "Europe"
    }
    southafricanorth   = @{
        location          = "Johannesburg"
        geography         = "South Africa"
        geographyGrouping = "Middle East and Africa"
    }
    southafricawest    = @{
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
    switzerlandnorth   = @{
        location          = "Zurich"
        geography         = "Switzerland"
        geographyGrouping = "Europe"
    }
    switzerlandwest    = @{
        location          = "Geneva"
        geography         = "Switzerland"
        geographyGrouping = "Europe"
    }
    uaecentral         = @{
        location          = "Abu Dhabi"
        geography         = "United Arab Emirates"
        geographyGrouping = "Middle East and Africa"
    }
    uaenorth           = @{
        location          = "Dubai"
        geography         = "United Arab Emirates"
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
function ValidationMappingData() {
    $hasMissingRegion = $false
    foreach ($location in $locations) {
        if (!$locationHashtable.ContainsKey($location.Location)) {
            Write-Host "$($location.Location) is missed in mapping data"
            $hasMissingRegion = $true
        }
    }

    return $hasMissingRegion
}

function DumpHtmlTable() {
    # Build a sorted directory with following format 
    # Key            Value
    # ---            -----
    # Asia Pacific   [Southeast Asia(Hongkong), East Asia(Hongkong)]
    $sorted = New-Object 'System.Collections.Generic.SortedDictionary[String,Array]'
    foreach ( $key in $locationHashtable.Keys ) {
        $geography = $locationHashtable[$key].geography
        $list = New-Object 'System.Collections.Generic.List[String]'
        if (-not $sorted.ContainsKey($geography)) {
            foreach ( $key in $locationHashtable.Keys | Sort-Object ) {
                if ( $locationHashtable[$key].geography -eq $geography ) {
                    $location = $locations | Where-Object { $_.Location -eq $key };
                    $displayName = $location.DisplayName + " ( $($locationHashtable[$key].Location) )"
                    $list.Add($displayName)
                }
            }
            $sorted.Add($geography, $list )
        }
    }

    # Print html table string to console
    foreach ($key in $sorted.Keys ) {
        Write-Host "<tr><td>$($key)</td><td>" 
        foreach ($value in $sorted[$key]) {
            Write-Host "$($value)<br/>" 
        }
        Write-Host "</td></tr>"
    }
}

if (ValidationMappingData) {
    Write-Host "Please fixing missing region(s) first and re-run"
}
else {
    DumpHtmlTable
}
