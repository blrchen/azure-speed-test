angular
    .module('azurespeed')
    .controller('AzureBillingMetersController', ['$scope', '$http', function ($scope, $http) {
        $http.get('/api/billingmeters', {})
            .then(function (response) {
                $scope.meters = response.data;
            }, function () {
            });
    }]);