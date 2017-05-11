angular
    .module('azurespeed')
    .controller('UploadController', ['$scope', '$http', '$controller', '$q', function($scope, $http, $controller, $q) {
        $scope.selectedRegionIds = [];

        $scope.$on('checkChanged', function() {
            $scope.selectedRegionIds = $scope.user.regions;
        });

        $scope.results = [];

        $scope.uploadLoop = function() {
            $scope.results = [];
            var chain = $q.when();
            var regionsSelected = regions.filter(function(v) {
                return $scope.user.regions.indexOf(v.id) >= 0;
            });

            [].forEach.call(regionsSelected, (region) => {
                chain = chain.then(function() {
                    return uploadBlob(region);
                });
            });
            chain.then(x => console.log(x));
            return chain;
        }

        $scope.canClick = function() {
            return true;
        }

        function uploadBlob(region) {
            var data = { region: region.name, blobName: guid.newGuid(), operation: 'upload' };
            return new $q((res, rej) => {
                $http.get('/api/sas', { params: data })
                    .then(function(response) {
                        var content = [];
                        var byteSize = 256 * 1024;
                        for (var i = 0; i < byteSize; i++) {
                            content.push('.');
                        }

                        var blobUrl = response.data;
                        var blob = ja.storage.blob(blobUrl);
                        var st = new Date();
                        var current = null;
                        var before = function() {
                            st = new Date();
                            current = {
                                'geo': region.geo,
                                'region': region.name,
                                'location': region.location,
                                'progressPercent': 0
                            };
                            $scope.results.push(current);
                        };
                        var progress = function(ev) {
                            current.progressPercent = ((ev.loaded / ev.total) * 100).toFixed(0);
                            $scope.$digest();
                        };
                        var success = function() {
                            var elapsedSeconds = (new Date() - st) / 1000;
                            var speed = utils.getSizeStr(byteSize / elapsedSeconds) + '/s';
                            current.speed = speed;
                            $scope.results.last = current;
                            $scope.$digest();
                            res("over");
                        };
                        var error = function(err) {
                            res("over");
                        };
                        blob.upload(content, before, progress, success, error);
                    });
            });
        }

    }]);

