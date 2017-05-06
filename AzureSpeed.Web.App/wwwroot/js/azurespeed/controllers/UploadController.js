angular
    .module('azurespeed')
    .controller('UploadController', ['$scope', '$http', '$controller', function ($scope, $http, $controller) {
        $scope.selectedRegionIds = [];
        $scope.$on('checkChanged', function () {
            $scope.selectedRegionIds = $scope.user.regions;
        });

        $scope.results = [];
        $scope.upload = function () {
            if ($scope.user.regions.length == 0) {
                return;
            }
            var region = regions.first(function (v) { return v.id == $scope.user.regions[0]; });
            var data = { region: region.name, blobName: guid.newGuid(), operation: 'upload' };
            $http.get('/api/sas', { params: data })
                .then(function (response) {
                    var content = [];
                    var byteSize = 256 * 1024;
                    for (var i = 0; i < byteSize; i++) {
                        content.push('.');
                    }

                    var blobUrl = response.data;
                    var blob = ja.storage.blob(blobUrl);
                    var st = new Date();
                    var before = function () {
                        st = new Date();
                        $scope.current = {
                            'geo': region.geo,
                            'region': region.name,
                            'location': region.location,
                            'progressPercent': 0
                        };
                        $scope.results.push($scope.current);
                    };
                    var progress = function (ev) {
                        $scope.current.progressPercent = ((ev.loaded / ev.total) * 100).toFixed(0);
                        $scope.$digest();
                    };
                    var success = function () {
                        var elapsedSeconds = (new Date() - st) / 1000;
                        var speed = utils.getSizeStr(byteSize / elapsedSeconds) + '/s';
                        $scope.current.speed = speed;
                        $scope.results.last = $scope.current;
                        $scope.$digest();
                        $scope.user.regions.shift();
                        $scope.upload();
                    };
                    var error = function (err) {
                    };
                    blob.upload(content, before, progress, success, error);
                }, function () {
                });
        };
        $scope.uploadLoop = function () {
            $scope.upload();
        };
        $scope.canClick = function () {
            return true;
        }
    }]);