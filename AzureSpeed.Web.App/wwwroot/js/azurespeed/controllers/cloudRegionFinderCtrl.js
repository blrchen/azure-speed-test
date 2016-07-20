angular
    .module('azurespeed')
    .controller('cloudRegionFinderCtrl', ['$scope', '$http', function ($scope, $http) {
        $scope.result = '';
        $scope.ipOrUrl = '';
        $scope.click = function () {
            $scope.result = 'Please wait';
            $http.get('/api/region', { params: { ipOrUrl: $scope.ipOrUrl } }).success(function (response) {
                $scope.result = response;
            }).error(function (response) {
                $scope.result = response;
            });
        }
        $scope.canSearch = function () {
            // is valid ip
            if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test($scope.ipOrUrl)) {
                return true;
            }
            // is url valid
            // http://stackoverflow.com/questions/5717093/check-if-a-javascript-string-is-an-url
            var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                                      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                                      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                                      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                                      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                                      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
            if (pattern.test($scope.ipOrUrl)) {
                return true;
            }
            return false;
        }
    }]);