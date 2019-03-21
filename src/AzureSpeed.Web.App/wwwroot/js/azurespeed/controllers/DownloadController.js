angular
    .module('azurespeed')
    .controller('DownloadController', ['$scope', '$http', '$controller', function ($scope, $http) {
        $scope.load = function () {
            var blobName = '100MB.bin';
            angular.forEach($scope.user.regions, function (value, key) {
                var region = $scope.user.regions.find(function (r) { return r.id === value.id });
                var data = { locationId: region.locationId, blobName: blobName, operation: 'download' };
                $http.get('/api/sas', { params: data })
                    .then(function (response) {
                        region.url = response.data.url;
                    }, function () {
                    });
            });
        }

        $scope.$on('checkChanged', function () {
            $scope.load();
        });

        $scope.load();
    }]);