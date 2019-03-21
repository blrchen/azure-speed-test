angular
    .module('azurespeed')
    .controller('AzureVMPricingController', ['$scope', '$http', function ($scope, $http) {
        $http.get('/api/vmslugs', {})
            .then(function (response) {
                $scope.slugs = response.data;

                // Change pricesByRegion format from "pricesByRegion": { "AP East": 0.018, "AP Southeast": 0.018 }
                // to "pricesByRegion": [{region: "AP East": "price": 0.018}, {region:"AP Southeast": "price": 0.018 }]
                angular.forEach($scope.slugs, function(value, key) {
                    var pricesByRegion = [];
                    var keys = Object.keys(value.prices.pricesByRegion);
                    for (var i = 0; i < keys.length; i++) {
                        var val = value.prices.pricesByRegion[keys[i]];
                        pricesByRegion.push({'region': keys[i], 'price':val});
                    }
                    value.prices.pricesByRegion = pricesByRegion;
                  });
            }, function () {
            });
    }]);