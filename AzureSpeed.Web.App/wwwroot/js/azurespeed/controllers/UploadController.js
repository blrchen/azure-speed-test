angular
    .module('azurespeed')
    .controller('UploadController', ['$scope', '$http', '$controller', function ($scope, $http, $controller) {
        $scope.selectedRegionIds = [];
        $scope.$on('checkChanged', function () {
            $scope.selectedRegionIds = $scope.user.regions;
        });

        $scope.results = [];
        $scope.upload = function () {
            httpBuild();
        };

        var httpWithPromise = function(ok, fail) {
            return new Promise((resolve, reject) => {
                try {
                    ok(function () {
                        resolve("OK");
                    });
                    
                } catch (err){
                    fail();
                    reject(err);
                }
            });
        };

        var httpPromiseCompose = function (p1, p2) {
            return new Promise((resolve, reject) => {
                if (p1 && p2) {
                    p1.then(
                        (sucess) => {
                            p2.then((s) => {
                                resolve("OK");
                            }, (e) => {
                                resolve("Failed");
                            });
                        },
                        (fail) => {
                            resolve("Failed");
                        }
                    );
                }
            }); 
        }

        var httpBuild = function () {
            var regionSelected = regions.filter(function (v) {
                return $scope.user.regions.indexOf(v.id) >= 0;
            });
            
            var list = [].map.call(regionSelected, (region) => {
                var data = { region: region.name, blobName: guid.newGuid(), operation: 'upload' };
                return httpWithPromise((callback) => {
                    $http.get('/api/sas', { params: data })
                        .success(function (response) {
                            var content = [];
                            var byteSize = 256 * 1024;
                            for (var i = 0; i < byteSize; i++) {
                                content.push('.');
                            }

                            var blobUrl = response;
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

                                //$scope.user.regions.shift();
                                //$scope.upload();
                                callback();

                            };
                            var error = function (err) {
                            };
                            blob.upload(content, before, progress, success, error);
                        });
                }, (f) => {
                    console.log(f);
                    });            
            }); 
            var outs = [].reduce.call(list, (acc, cur) => {
                return httpPromiseCompose(acc, cur);
            });

            outs.then((sucess) => { console.log(sucess); }, (fail) => { console.log(fail);});
        }

        $scope.uploadLoop = function () {
            $scope.upload();
        };
        $scope.canClick = function () {
            return true;
        }

    }]);

