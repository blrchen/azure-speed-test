angular
    .module('azurespeed')
    .controller('DownloadController', ['$scope', '$http', '$controller', function ($scope, $http) {
        $scope.load = function () {
            var blobName = '100MB.bin';
            $scope.items = regions.where(function (d) { return $scope.user.regions.indexOf(d.id) != -1 });
            angular.forEach($scope.user.regions, function (value, key) {
                var region = regions.first(function (d) { return d.id == value });
                var data = { region: region.name, blobName: blobName, operation: 'download' };
                $http.get('/api/sas', { params: data })
                    .then(function (response) {
                        region.url = response.data;
                    }, function () {
                    });
            });
        }

        $scope.$on('checkChanged', function (event, message) {
            $scope.load();
        });

        $scope.load();
    }]);