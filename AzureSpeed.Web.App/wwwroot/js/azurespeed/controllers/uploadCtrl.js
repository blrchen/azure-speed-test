angular
    .module('azurespeed')
    .controller('uploadCtrl', ['$scope', '$http', function ($scope, $http) {
        $scope.results = [];
        $scope.regions = utils.getRegions();
        $scope.checkedRegions = [];
        $scope.message = 'test mess';
        $scope.upload = function () {
            if ($scope.checkedRegions.length == 0) {
                return;
            }
            var data = { region: $scope.checkedRegions[0].region, blobName: guid.newGuid(), operation: 'upload' };
            $http.get('/api/sas', { params: data }).success(function (response) {
                var content = [];
                var byteSize = 256 * 1024;
                for (var i = 0; i < byteSize; i++) {
                    content.push('.');
                }

                var storage = $scope.checkedRegions[0].name;
                var url = response;
                console.log(storage);
                console.log(url);
                var blob = ja.storage.blob(url);
                var st = new Date();
                var before = function () {
                    st = new Date();
                    $scope.current = {
                        'geozone': $scope.checkedRegions[0].geozone,
                        'region': $scope.checkedRegions[0].region,
                        'location': $scope.checkedRegions[0].location,
                        'progressPercent': 0
                    };
                    $scope.results.push($scope.current);
                };
                var progress = function (ev) {
                    $scope.current.progressPercent = ((ev.loaded / ev.total) * 100).toFixed(0);
                    console.log('progressPercent = ' + $scope.current.progressPercent);
                    $scope.$digest();
                };
                var success = function () {
                    var elapsedSeconds = (new Date() - st) / 1000;
                    var speed = utils.getSizeStr(byteSize / elapsedSeconds) + '/s';
                    console.log('speed = ' + speed);
                    $scope.current.speed = speed;
                    $scope.results.last = $scope.current;
                    $scope.$digest();
                    console.log(storage + ' upload completed successfully, speed = ' + speed);
                    $scope.checkedRegions.shift();
                    $scope.upload();
                };
                var error = function (err) {
                    //upload.uploadTable.find('tr[name="' + storage + '"] td.upload-speed').text('upload completed with error');
                    console.log(storage + ' upload completed with error' + err);
                };
                blob.upload(content, before, progress, success, error);
            });
        };
        $scope.uploadLoop = function () {
            $scope.upload();
        };
        $scope.regionChange = function () {
            $scope.checkedRegions = [];
            angular.forEach($scope.regions, function (value, key) {
                if (value.checked) {
                    $scope.checkedRegions.push(value);
                }
            });
        }
        $scope.canClick = function () {
            return $scope.checkedRegions.length > 0;
        }
    }]);