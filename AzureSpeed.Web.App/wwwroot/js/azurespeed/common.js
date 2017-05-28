// CDN is turned off due to DDOS attach
// var cdn = [{ id: 0, alias: 'cdn', storage: 'cdn', geo: 'CDN', regionId:'', name: 'CDN', location: 'CDN' }];
// TODO: Remove id
var regions = [
    { id: 0, regionId: 'uswest', name: 'West US', alias: 'westus', storage: 'azspdwestus', geo: 'America', location: 'California' },
    { id: 1, regionId: 'useast', name: 'East US', alias: 'eastus', storage: 'azspdeastus', geo: 'America', location: 'Virginia' },
    { id: 2, regionId: 'useast2', name: 'East US 2', alias: 'eastus2', storage: 'azspdeastus2', geo: 'America', location: 'Virginia' },
    { id: 3, regionId: 'usnorth', name: 'North Central US', alias: 'northcentralus', storage: 'azspdnorthcentralus', geo: 'America', location: 'Illinois' },
    { id: 4, regionId: 'uswest2', name: 'West US 2', alias: 'westus2', storage: 'azspdwestus2', geo: 'America', location: 'West US 2' },
    { id: 5, regionId: 'ussouth', name: 'South Central US', alias: 'southcentralus', storage: 'azspdsouthcentralus', geo: 'America', location: 'Texas' },
    { id: 6, regionId: 'uscentral', name: 'Central US', alias: 'centralus', storage: 'azspdcentralus', geo: 'America', location: 'Iowa' },
    { id: 7, regionId: 'europewest', name: 'West Europe', alias: 'westeurope', storage: 'azspdwesteurope', geo: 'Europe', location: 'Netherlands' },
    { id: 8, regionId: 'europenorth', name: 'North Europe', alias: 'northeurope', storage: 'azspdnortheurope', geo: 'Europe', location: 'Ireland' },
    { id: 9, regionId: 'asiaeast', name: 'East Asia', alias: 'eastasia', storage: 'azspdeastasia', geo: 'Asia', location: 'Hong Kong' },
    { id: 10, regionId: 'asiasoutheast', name: 'Southeast Asia', alias: 'southeastasia', storage: 'azspdsoutheastasia', geo: 'Asia', location: 'Singapore' },
    { id: 11, regionId: 'japaneast', name: 'Japan East', alias: 'japaneast', storage: 'azspdjapaneast', geo: 'Asia', location: 'Saitama Prefecture' },
    { id: 12, regionId: 'japanwest', name: 'Japan West', alias: 'japanwest', storage: 'azspdjapanwest', geo: 'Asia', location: 'Osaka Prefecture' },
    { id: 13, regionId: 'brazilsouth', name: 'Brazil South', alias: 'brazilsouth', storage: 'azspdbrazilsouth', geo: 'America', location: 'Sao Paulo State' },
    { id: 14, regionId: 'australiaeast', name: 'Australia East', alias: 'australiaeast', storage: 'azspdaustraliaeast', geo: 'Asia', location: 'New South Wales' },
    { id: 15, regionId: 'australiasoutheast', name: 'Australia Southeast', alias: 'australiasoutheast', storage: 'azspdaustraliasoutheast', geo: 'Asia', location: 'Victoria' },
    { id: 16, regionId: 'indiasouth', name: 'South India', alias: 'southindia', storage: 'azspdsouthindia', geo: 'Asia', location: 'Chennai' },
    { id: 17, regionId: 'indiawest', name: 'West India', alias: 'westindia', storage: 'azspdwestindia', geo: 'Asia', location: 'Mumbai' },
    { id: 18, regionId: 'indiacentral', name: 'Central India', alias: 'centralindia', storage: 'azspdcentralindia', geo: 'Asia', location: 'Pune' },
    { id: 19, regionId: 'canadacentral', name: 'Canada Central', alias: 'canadacentral', storage: 'azspdcanadacentral', geo: 'America', location: 'Toronto' },
    { id: 20, regionId: 'canadaeast', name: 'Canada East', alias: 'canadaeast', storage: 'azspdcanadaeast', geo: 'America', location: 'Quebec City' },
    { id: 21, regionId: 'uswestcentral', name: 'West Central US', alias: 'westcentralus', storage: 'azspdwestcentralus', geo: 'America', location: 'West Central US' },
    { id: 22, regionId: 'ukwest', name: 'UK West', alias: 'ukwest', storage: 'azspdukwest', geo: 'Europe', location: 'Cardiff' },
    { id: 23, regionId: 'uksouth', name: 'UK South', alias: 'uksouth', storage: 'azspduksouth', geo: 'Europe', location: 'London' },
    { id: 24, regionId: 'koreasouth', name: 'Korea South', alias: 'koreasouth', storage: 'azspdkoreasouth', geo: 'Asia', location: 'Busan' },
    { id: 25, regionId: 'koreacentral', name: 'Korea Central', alias: 'koreacentral', storage: 'azspdkoreacentral', geo: 'Asia', location: 'Seoul' },
    { id: 26, regionId: 'chinaeast', name: 'China East', alias: 'chinaeast', storage: 'azspchinaeast', geo: 'Asia', location: 'Shanghai', endpointSuffic: 'core.chinacloudapi.cn' },
    { id: 27, regionId: 'chinanorth', name: 'China North', alias: 'chinanorth', storage: 'azspchinanorth', geo: 'Asia', location: 'Beijing', endpointSuffic: 'core.chinacloudapi.cn' }
];