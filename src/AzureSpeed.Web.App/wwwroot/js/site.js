var app = angular
  .module('azurespeed', ['angular.filter', 'ui.bootstrap', 'checklist-model', 'LocalStorageModule']);

app.config(function (localStorageServiceProvider) {
  localStorageServiceProvider
    .setPrefix('azurespeed')
    .setStorageType('localStorage')
    .setStorageCookieDomain('.')
    .setNotify(true, true);
});
