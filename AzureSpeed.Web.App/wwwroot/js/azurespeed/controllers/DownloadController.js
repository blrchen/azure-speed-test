angular
    .module('azurespeed')
    .controller('DownloadController', ['$scope', '$http', '$controller', function ($scope, $http) {
        $scope.load = function () {
            var blobName = '100MB.bin';
            angular.forEach($scope.user.regions, function (value, key) {
                var region = $scope.user.regions.find(function (r) { return r.id === value.id });
                var data = { region: region.name, blobName: blobName, operation: 'download' };
                $http.get('/api/sas', { params: data })
                    .then(function (response) {
                        region.url = response.data;
                    }, function () {
                    });
            });
        }

        $scope.$on('checkChanged', function () {
            console.log($scope.user.regions);
            $scope.load();
        });

        $scope.load();
    }]);