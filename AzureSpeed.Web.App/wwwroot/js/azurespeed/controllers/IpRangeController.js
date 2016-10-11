angular
    .module('azurespeed')
    .controller('IpRangeController', ['$scope', '$http', function ($scope, $http) {
        $http.get('/api/iprange', {}).success(function (response) {
            $scope.subnetList = response;
        });
    }]);