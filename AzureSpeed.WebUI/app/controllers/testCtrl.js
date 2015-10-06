angular.module('app')
    .controller('testCtrl', ['$scope', '$http', '$modal', '$log', function ($scope, $http) {
        $scope.foo = 'foo';
    }]);