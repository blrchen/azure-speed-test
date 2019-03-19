angular
    .module('azurespeed')
    .controller('MainController', ['$scope', 'localStorageService', function ($scope, localStorageService) {
        $scope.regions = regions;
        $scope.user = {
            regions: []
        };

        var localStorage = localStorageService.get('userSelectedRegions');
        if (localStorage) {
            // If out-dated schema found, clean local storage to avoid runtime error - Region is number
            if (localStorage.length >= 1 && angular.isNumber(localStorage[0])) {
                localStorageService.remove('userSelectedRegions');
                localStorage = regions.filter(function (r) {
                    return r.geoName === 'Americas';
                });
            }
            // If out-dated schema found, clean local storage to avoid runtime error - Region is number
            if (localStorage.length >= 1 && !localStorage[0].hasOwnProperty('locationId')) {
                localStorageService.remove('userSelectedRegions');
                localStorage = regions.filter(function (r) {
                    return r.geoName === 'Americas';
                });
            }
            $scope.user.regions = localStorage;
        } else {
            $scope.user = {};
            $scope.user.regions = regions.filter(function (r) {
                return r.geoName === 'Americas';
            });
        }

        $scope.checkAll = function (key) {
            $scope.user.regions = $scope.user.regions.filter(function (r) {
                return r.geoName !== key;
            });
            $scope.user.regions = $scope.user.regions.concat(regions.filter(function (r) {
                return r.geoName === key;
            }));
        };

        $scope.uncheckAll = function (key) {
            $scope.user.regions = $scope.user.regions.filter(function (r) {
                return r.geoName !== key;
            });
        };

        $scope.checkChanged = function () {
            $scope.$broadcast('checkChanged');
            localStorageService.set('userSelectedRegions', $scope.user.regions);

            // Below code to share user selected regions to latency test page 
            // This is a temp workaround before latency page is fully re-wrotten with angular
            window.userRegions = $scope.user.regions;
        };

        // TODO: Workaround to ensure latency page can get correct region list. 
        // Remove when it's changed to angular
        $scope.checkChanged();
    }]);
