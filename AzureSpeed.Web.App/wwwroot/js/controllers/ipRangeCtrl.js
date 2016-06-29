angular
    .module('app')
    .controller('ipRangeCtrl', ['$scope', '$http', function ($scope, $http) {
        $http.get('/api/iprange', {}).success(function (response) {
            $scope.subnetList = response;
        });
    }]);