angular
    .module('azurespeed')
    .controller('MainController', ['$scope', 'localStorageService', function ($scope, localStorageService) {
        $scope.regions = regions;
        $scope.user = {
            regions: []
        };

        var localStorage = localStorageService.get('userSelectedRegions');
        if (localStorage) {
            // If data in local storage is found to use old data schema, remove it
            if (localStorage.length >= 1 && angular.isNumber(localStorage[0])) {
                localStorageService.remove('userSelectedRegions');
                localStorage = regions.filter(function (r) {
                    return r.geo === 'America';
                });
            }
            $scope.user.regions = localStorage;
        } else {
            $scope.user = {};
            $scope.user.regions = regions.filter(function (r) {
                return r.geo === 'America';
            });
        }

        $scope.checkAll = function (key) {
            $scope.user.regions = $scope.user.regions.filter(function (r) {
                return r.geo !== key;
            });
            $scope.user.regions = $scope.user.regions.concat(regions.filter(function (r) {
                return r.geo === key;
            }));
            console.log($scope.user.regions);
        };

        $scope.uncheckAll = function (key) {
            $scope.user.regions = $scope.user.regions.filter(function (r) {
                return r.geo !== key;
            });
            console.log($scope.user.regions);
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
