angular
  .module('azurespeed')
  .controller('IpRangeController', ['$scope', '$http', function ($scope, $http) {
    $http.get('/api/iprange', {})
      .then(function (response) {
        $scope.subnetList = response.data;
      }, function () {
      });
  }]);