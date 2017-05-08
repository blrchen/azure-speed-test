angular
    .module('azurespeed')
    .controller('UploadController', ['$scope', '$http', '$controller', function ($scope, $http, $controller) {
        $scope.selectedRegionIds = [];
        $scope.$on('checkChanged', function () {
            $scope.selectedRegionIds = $scope.user.regions;
        });

        $scope.results = [];
        $scope.upload = function () {
            var regionSelected = regions.filter(function (v) {
                return $scope.user.regions.indexOf(v.id) >= 0;
            });

            var list = [].map.call(regionSelected, (region) => {
                var data = { region: region.name, blobName: guid.newGuid(), operation: 'upload' };
                return TaskAsync.Run((callback) => {

                    TaskAsync.Run((cb) => {
                        $http.get('/api/sas', { params: data })
                            .success(function (response) {
                                cb(response);
                            })
                    }).Wait((res) => {
                        var content = [];
                        var byteSize = 256 * 1024;
                        for (var i = 0; i < byteSize; i++) {
                            content.push('.');
                        }

                        var blobUrl = res;
                        var blob = ja.storage.blob(blobUrl);
                        var st = new Date();
                        var current = null;
                        var before = function () {
                            st = new Date();
                            current = {
                                'geo': region.geo,
                                'region': region.name,
                                'location': region.location,
                                'progressPercent': 0
                            };
                            $scope.results.push(current);
                        };
                        var progress = function (ev) {
                            current.progressPercent = ((ev.loaded / ev.total) * 100).toFixed(0);
                            $scope.$digest();
                        };
                        var success = function () {
                            var elapsedSeconds = (new Date() - st) / 1000;
                            var speed = utils.getSizeStr(byteSize / elapsedSeconds) + '/s';
                            current.speed = speed;
                            $scope.results.last = current;
                            $scope.$digest();
                            callback("over!");
                        };
                        var error = function (err) {
                        };
                        blob.upload(content, before, progress, success, error);
                    }, (fail) => { console.log(fail); });
                });
            });

            TaskAsync
                .WhenAll(list)
                .Wait((sucess) => { console.log(sucess); });
        }

        $scope.uploadLoop = function () {
            $scope.upload();
        };
        $scope.canClick = function () {
            return true;
        }

    }]);

