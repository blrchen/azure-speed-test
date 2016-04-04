angular.module('app')
    .controller('downloadCtrl', ['$scope', '$http', '$modal', '$log', function ($scope, $http) {
        $scope.items = utils.getRegions();
        angular.forEach($scope.items, function (value, key) {
            console.log(value);
            var data = { region: value.region, blobName: '100MB.bin', operation: 'download' };
            $http.get('/api/sas', { params: data }).success(function (response) {
                value.url = response;
            });
        });
    }]);