angular
    .module('azurespeed')
    .controller('MainController', ['$scope', 'localStorageService', function ($scope, localStorageService) {
        $scope.regions = regions;

        var localStorage = localStorageService.get('userSelectedRegions');

        if (localStorage) {
            $scope.user = {
                regions: localStorage
            };
        } else {
            $scope.user = {
                regions: [2, 3, 4, 5, 6, 7, 12, 18, 19, 23, 22]
            };
        }

        $scope.checkAll = function (key) {
            var regionTemp = $scope.user.regions;
            $scope.regions.map(function (item) {
                if (item.geo == key && regionTemp.where(function (d) { return d == item.id }).length == 0) {
                    $scope.user.regions.push(item.id);
                }
            });
        };

        $scope.uncheckAll = function (key) {
            var regionTemp = $scope.user.regions;

            $scope.regions.map(function (item) {
                if (item.geo == key) {
                    regionTemp.remove(item.id);
                }
            });

            $scope.user.regions = regionTemp;
        };
        $scope.checkChanged = function () {
            $scope.$broadcast('checkChanged');
            // Below code to share user selected regions to latency test page 
            // This is a temp workaround before latency page is fully re-wrotten with angular
            window.userregions = $scope.user.regions;
            localStorageService.set('userSelectedRegions', $scope.user.regions);
        };

        // TODO: Workaround to ensure latency page can get correct region list. 
        // Remove when it's changed to angular
        $scope.checkChanged();
    }]);
