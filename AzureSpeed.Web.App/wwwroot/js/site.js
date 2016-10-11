// TODO: WHY NEED?
(function () {
    var app = angular
            .module('azurespeed', ['angular.filter', 'ui.bootstrap', 'checklist-model', 'LocalStorageModule']);

    app.config(function (localStorageServiceProvider) {
        localStorageServiceProvider
          .setPrefix('myApp')
          .setStorageType('localStorage')
          .setStorageCookieDomain('.')
          .setNotify(true, true)
    });
})()
