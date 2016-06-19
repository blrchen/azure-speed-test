angular
    .module('app')
    .controller('ipRangeCtrl', ['$scope', '$http', '$modal', '$log', function ($scope, $http) {
        $http.get('/api/iprange', {}).success(function (response) {
            $scope.subnetList = response;
        });
    }]);