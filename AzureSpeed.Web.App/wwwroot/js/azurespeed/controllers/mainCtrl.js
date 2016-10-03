angular
    .module('azurespeed')
    .controller('mainCtrl', ['$scope', function ($scope) {
        $scope.regions = [
            { id: 0, name: 'East Asia', alias: 'eastasia', storage: 'azspdeastasia', geo: 'Asia', location: 'Hong Kong' },
            { id: 1, name: 'Southeast Asia', alias: 'southeastasia', storage: 'azspdsoutheastasia', geo: 'Asia', location: 'Singapore' },
            { id: 2, name: 'Central US', alias: 'centralus', storage: 'azspdcentralus', geo: 'America', location: 'Iowa' },
            { id: 3, name: 'East US', alias: 'eastus', storage: 'azspdeastus', geo: 'America', location: 'Virginia' },
            { id: 4, name: 'East US 2', alias: 'eastus2', storage: 'azspdeastus2', geo: 'America', location: 'Virginia' },
            { id: 5, name: 'West US', alias: 'westus', storage: 'azspdwestus', geo: 'America', location: 'California' },
            { id: 6, name: 'North Central US', alias: 'northcentralus', storage: 'azspdnorthcentralus', geo: 'America', location: 'Illinois' },
            { id: 7, name: 'South Central US', alias: 'southcentralus', storage: 'azspdsouthcentralus', geo: 'America', location: 'Texas' },
            { id: 8, name: 'North Europe', alias: 'northeurope', storage: 'azspdnortheurope', geo: 'Europe', location: 'Ireland' },
            { id: 9, name: 'West Europe', alias: 'westeurope', storage: 'azspdwesteurope', geo: 'Europe', location: 'Netherlands' },
            { id: 10, name: 'Japan West', alias: 'japanwest', storage: 'azspdjapanwest', geo: 'Asia', location: 'Osaka Prefecture' },
            { id: 11, name: 'Japan East', alias: 'japaneast', storage: 'azspdjapaneast', geo: 'Asia', location: 'Saitama Prefecture' },
            { id: 12, name: 'Brazil South', alias: 'brazilsouth', storage: 'azspdbrazilsouth', geo: 'America', location: 'Sao Paulo State' },
            { id: 13, name: 'Australia East', alias: 'australiaeast', storage: 'azspdaustraliaeast', geo: 'Asia', location: 'New South Wales' },
            { id: 14, name: 'Australia Southeast', alias: 'australiasoutheast', storage: 'azspdaustraliasoutheast', geo: 'Asia', location: 'Victoria' },
            { id: 15, name: 'South India', alias: 'southindia', storage: 'azspdsouthindia', geo: 'Asia', location: 'Chennai' },
            { id: 16, name: 'Central India', alias: 'centralindia', storage: 'azspdcentralindia', geo: 'Asia', location: 'Pune' },
            { id: 17, name: 'West India', alias: 'westindia', storage: 'azspdwestindia', geo: 'Asia', location: 'Mumbai' },
            { id: 18, name: 'Canada Central', alias: 'canadacentral', storage: 'azspdcanadacentral', geo: 'America', location: 'Toronto' },
            { id: 19, name: 'Canada East', alias: 'canadaeast', storage: 'azspdcanadaeast', geo: 'America', location: 'Quebec City' },
            { id: 20, name: 'UK South', alias: 'south', storage: 'azspduksouth', geo: 'Europe', location: 'London' },
            { id: 21, name: 'UK West', alias: 'ukwest', storage: 'azspdukwest', geo: 'Europe', location: 'Cardiff' },
            { id: 22, name: 'West Central US', alias: 'westcentralus', storage: 'azspdwestcentralus', geo: 'America', location: 'West Central US' },
            { id: 23, name: 'West US 2', alias: 'westus2', storage: 'azspdwestus2', geo: 'America', location: 'West US 2' },
            { id: 24, name: 'China East', alias: 'chinaeast', storage: 'azspchinaeast', geo: 'Asia', location: 'Shanghai', endpointSuffic: 'core.chinacloudapi.cn' },
            { id: 25, name: 'China North', alias: 'chinanorth', storage: 'azspchinanorth', geo: 'Asia', location: 'Beijing', endpointSuffic: 'core.chinacloudapi.cn' }
        ];
        $scope.user = {
            regions: [2, 3, 4, 5, 6, 7, 12, 18, 19, 23, 22] // select all US data centers by default
        };
        $scope.checkAll = function () {
            $scope.user.regions = $scope.regions.map(function (item) { return item.id; });
        };
        $scope.uncheckAll = function () {
            $scope.user.regions = [];
        };
        $scope.checkChanged = function () {
            $scope.$broadcast('checkChanged');
            // Below code to share user selected regions to latency test page 
            // This is a temp workaround before latency page is fully re-wrotten with angular
            window.userregions = $scope.user.regions;
        };
        $scope.checkChanged();
    }]);
