// CDN is turned off due to DDOS attach
// var cdn = [{ id: 0, alias: 'cdn', storage: 'cdn', geo: 'CDN', regionId:'', name: 'CDN', location: 'CDN' }];
// TODO: Remove id
var regions = [
    { id: 0, regionId: 'uswest', name: 'West US', alias: 'westus', storage: 'sptwestus', geo: 'America', location: 'California' },
    { id: 1, regionId: 'useast', name: 'East US', alias: 'eastus', storage: 'spteastus', geo: 'America', location: 'Virginia' },
    { id: 2, regionId: 'useast2', name: 'East US 2', alias: 'eastus2', storage: 'spteastus2', geo: 'America', location: 'Virginia' },
    { id: 3, regionId: 'usnorth', name: 'North Central US', alias: 'northcentralus', storage: 'sptnorthcentralus', geo: 'America', location: 'Illinois' },
    { id: 4, regionId: 'uswest2', name: 'West US 2', alias: 'westus2', storage: 'sptwestus2', geo: 'America', location: 'West US 2' },
    { id: 5, regionId: 'ussouth', name: 'South Central US', alias: 'southcentralus', storage: 'sptsouthcentralus', geo: 'America', location: 'Texas' },
    { id: 6, regionId: 'uscentral', name: 'Central US', alias: 'centralus', storage: 'sptcentralus', geo: 'America', location: 'Iowa' },
    { id: 7, regionId: 'europewest', name: 'West Europe', alias: 'westeurope', storage: 'sptwesteurope', geo: 'Europe', location: 'Netherlands' },
    { id: 8, regionId: 'europenorth', name: 'North Europe', alias: 'northeurope', storage: 'sptnortheurope', geo: 'Europe', location: 'Ireland' },
    { id: 9, regionId: 'asiaeast', name: 'East Asia', alias: 'eastasia', storage: 'spteastasia', geo: 'Asia', location: 'Hong Kong' },
    { id: 10, regionId: 'asiasoutheast', name: 'Southeast Asia', alias: 'southeastasia', storage: 'sptsoutheastasia', geo: 'Asia', location: 'Singapore' },
    { id: 11, regionId: 'japaneast', name: 'Japan East', alias: 'japaneast', storage: 'sptjapaneast', geo: 'Asia', location: 'Saitama Prefecture' },
    { id: 12, regionId: 'japanwest', name: 'Japan West', alias: 'japanwest', storage: 'sptjapanwest', geo: 'Asia', location: 'Osaka Prefecture' },
    { id: 13, regionId: 'brazilsouth', name: 'Brazil South', alias: 'brazilsouth', storage: 'sptbrazilsouth', geo: 'America', location: 'Sao Paulo State' },
    { id: 14, regionId: 'australiaeast', name: 'Australia East', alias: 'australiaeast', storage: 'sptaustraliaeast', geo: 'Asia', location: 'New South Wales' },
    { id: 15, regionId: 'australiasoutheast', name: 'Australia Southeast', alias: 'australiasoutheast', storage: 'sptaustraliasoutheast', geo: 'Asia', location: 'Victoria' },
    { id: 16, regionId: 'indiasouth', name: 'South India', alias: 'southindia', storage: 'sptsouthindia', geo: 'Asia', location: 'Chennai' },
    { id: 17, regionId: 'indiawest', name: 'West India', alias: 'westindia', storage: 'sptwestindia', geo: 'Asia', location: 'Mumbai' },
    { id: 18, regionId: 'indiacentral', name: 'Central India', alias: 'centralindia', storage: 'sptcentralindia', geo: 'Asia', location: 'Pune' },
    { id: 19, regionId: 'canadacentral', name: 'Canada Central', alias: 'canadacentral', storage: 'sptcanadacentral', geo: 'America', location: 'Toronto' },
    { id: 20, regionId: 'canadaeast', name: 'Canada East', alias: 'canadaeast', storage: 'sptcanadaeast', geo: 'America', location: 'Quebec City' },
    { id: 21, regionId: 'uswestcentral', name: 'West Central US', alias: 'westcentralus', storage: 'sptwestcentralus', geo: 'America', location: 'West Central US' },
    { id: 22, regionId: 'ukwest', name: 'UK West', alias: 'ukwest', storage: 'sptukwest', geo: 'Europe', location: 'Cardiff' },
    { id: 23, regionId: 'uksouth', name: 'UK South', alias: 'uksouth', storage: 'sptuksouth', geo: 'Europe', location: 'London' },
    { id: 24, regionId: 'koreasouth', name: 'Korea South', alias: 'koreasouth', storage: 'sptkoreasouth', geo: 'Asia', location: 'Busan' },
    { id: 25, regionId: 'koreacentral', name: 'Korea Central', alias: 'koreacentral', storage: 'sptkoreacentral', geo: 'Asia', location: 'Seoul' },
    { id: 26, regionId: 'francecentral', name: 'France Central', alias: 'francecentral', storage: 'sptfrancecentral', geo: 'Europe', location: 'Paris' },
    { id: 27, regionId: 'chinaeast', name: 'China East', alias: 'chinaeast', storage: 'azspchinaeast', geo: 'Asia(China)', location: 'Shanghai', endpointSuffic: 'core.chinacloudapi.cn' },
    { id: 28, regionId: 'chinanorth', name: 'China North', alias: 'chinanorth', storage: 'azspchinanorth', geo: 'Asia(China)', location: 'Beijing', endpointSuffic: 'core.chinacloudapi.cn' }
];