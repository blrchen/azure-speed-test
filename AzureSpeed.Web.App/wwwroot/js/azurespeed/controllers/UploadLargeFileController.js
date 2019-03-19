angular
    .module('azurespeed')
    .controller('UploadLargeFileController', ['$scope', '$http', function ($scope, $http) {
        $scope.results = [];
        $scope.blockSizes = [256, 512, 1024, 4096];
        $scope.threads = [1, 2, 4, 8, 16];
        $scope.progressNow = 0;
        $scope.progressPercent = 0;
        $scope.selectedBlockSize = 4096;
        $scope.selectedThread = 4;
        $scope.upload = function () {
            var file = $('#file-input')[0].files[0];
            var data = { locationId: $scope.selectedRegion.locationId, blobName: guid.newGuid(), operation: 'upload' };
            $http.get('/api/sas', { params: data }).then(function (response) {
                ja.storage.blockSize = $scope.selectedBlockSize * 1024;
                ja.storage.maxThread = $scope.selectedThread;
                var url = response.data.url;
                var blob = ja.storage.blob(url);
                var st = new Date();
                var before = function () {
                    $scope.fileName = file.name;
                    $scope.fileSize = utils.getSizeStr(file.size);
                    $scope.progressNow = 0;
                    $scope.progressPercent = 0;
                    $scope.$digest();
                };
                var progress = function (ev) {
                    $scope.progressNow = ev.loaded;
                    $scope.progressPercent = ((ev.loaded / ev.total) * 100).toFixed(0);
                    $scope.$digest();
                };
                var success = function () {
                    var elapsedSeconds = (new Date() - st) / 1000;
                    $scope.speed = utils.getSizeStr(file.size / elapsedSeconds) + '/s';
                    $scope.message = 'upload time = ' + elapsedSeconds + 's, speed = ' + $scope.speed;
                    $scope.$digest();
                    $scope.results.push({
                        fileName: $scope.fileName,
                        fileSize: $scope.fileSize,
                        region: $scope.selectedRegion.name,
                        blockSize: $scope.selectedBlockSize,
                        thread: $scope.selectedThread,
                        speed: $scope.speed
                    });
                };
                var error = function (err) {
                    $scope.error = err;
                };
                blob.upload(file, before, progress, success, error);
            }, function () {
            });
        };
        $scope.canUpload = function () {
            return $scope.selectedRegion && $('#file-input')[0].files.length > 0;
        };
    }]);