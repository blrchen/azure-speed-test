angular
    .module('azurespeed')
    .controller('DownloadController', ['$scope', '$http', '$controller', function ($scope, $http) {
        $scope.load = function() {
            $scope.items = regions.where(function (d) { return $scope.user.regions.indexOf(d.id) != -1 });
            angular.forEach($scope.user.regions, function (value, key) {
                var region = regions.first(function (d) { return d.id == value });
                var data = { region: region.name, blobName: '100MB.bin', operation: 'download' };
                $http.get('/api/sas', { params: data }).success(function (response) {
                    region.url = response;
                    console.log(response);
                });
            });
        }

        $scope.$on('checkChanged', function (event, message) {
            console.log($scope.user.regions);
            $scope.load();
        });

        $scope.load();
    }]);