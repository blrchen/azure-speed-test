// Write your Javascript code.
angular.module('azurespeed', ['ui.bootstrap'])

var cdn = [{ id: 0, name: 'cdn', storage: 'cdn', geo: 'CDN', region: 'CDN', location: 'CDN' }];
// TODO: Remove id
var dc = [
    { id: 1, name: 'eastasia', storage: 'azspdeastasia', geo: 'Asia-Pacific (APAC)', region: 'East Asia', location: 'Hong Kong' },
    { id: 2, name: 'southeastasia', storage: 'azspdsoutheastasia', geo: 'Asia-Pacific (APAC)', region: 'Southeast Asia', location: 'Singapore' },
    { id: 3, name: 'centralus', storage: 'azspdcentralus', geo: 'North America', region: 'Central US', location: 'Iowa' },
    { id: 4, name: 'eastus', storage: 'azspdeastus', geo: 'North America', region: 'East US', location: 'Virginia' },
    { id: 5, name: 'eastus2', storage: 'azspdeastus2', geo: 'North America', region: 'East US 2', location: 'Virginia' },
    { id: 6, name: 'westus', storage: 'azspdwestus', geo: 'North America', region: 'West US', location: 'California' },
    { id: 7, name: 'northcentralus', storage: 'azspdnorthcentralus', geo: 'North America', region: 'North Central US', location: 'Illinois' },
    { id: 8, name: 'southcentralus', storage: 'azspdsouthcentralus', geo: 'North America', region: 'South Central US', location: 'Texas' },
    { id: 9, name: 'northeurope', storage: 'azspdnortheurope', geo: 'Europe (EMEA)', region: 'North Europe', location: 'Ireland' },
    { id: 10, name: 'westeurope', storage: 'azspdwesteurope', geo: 'Europe (EMEA)', region: 'West Europe', location: 'Netherlands' },
    { id: 11, name: 'japanwest', storage: 'azspdjapanwest', geo: 'Asia-Pacific (APAC)', region: 'Japan West', location: 'Osaka Prefecture' },
    { id: 12, name: 'japaneast', storage: 'azspdjapaneast', geo: 'Asia-Pacific (APAC)', region: 'Japan East', location: 'Saitama Prefecture' },
    { id: 13, name: 'brazilsouth', storage: 'azspdbrazilsouth', geo: 'South America', region: 'Brazil South', location: 'Sao Paulo State' },
    { id: 14, name: 'australiaeast', storage: 'azspdaustraliaeast', geo: 'Australia', region: 'Australia East', location: 'New South Wales' },
    { id: 15, name: 'australiasoutheast', storage: 'azspdaustraliasoutheast', geo: 'Australia', region: 'Australia Southeast', location: 'Victoria' },
    { id: 16, name: 'southindia', storage: 'azspdsouthindia', geo: 'India', region: 'South India', location: 'Chennai' },
    { id: 17, name: 'centralindia', storage: 'azspdcentralindia', geo: 'India', region: 'Central India', location: 'Pune' },
    { id: 18, name: 'westindia', storage: 'azspdwestindia', geo: 'India', region: 'West India', location: 'Mumbai' },
    { id: 19, name: 'canadacentral', storage: 'azspdcanadacentral', geo: 'North America', region: 'Canada Central', location: 'Toronto' },
    { id: 20, name: 'canadaeast', storage: 'azspdcanadaeast', geo: 'North America', region: 'Canada East', location: 'Quebec City' },
    { id: 21, name: 'azspdwestcentralus', storage: 'azspdwestcentralus', geo: 'North America', region: 'West Central US', location: 'West Central US' },
    { id: 22, name: 'azspdwestus2', storage: 'azspdwestus2', geo: 'North America', region: 'West US 2', location: 'West US 2' },
    { id: 23, name: 'chinaeast', storage: 'azspchinaeast', geo: 'China', region: 'China East', location: 'Shanghai' },
    { id: 24, name: 'chinanorth', storage: 'azspchinanorth', geo: 'China', region: 'China North', location: 'Beijing' },
];

var checkStatusDc = new Array(22);

//checkStatusDc.forEach(function(value,index,))

(function () {
    var menuList = $('.nav.navbar-top-links.navbar-right');
    var filterMenu = menuList.find(".menu-label");
    var filter = menuList.find(".dropdown-extend");
    var listDiv = filter.find(".dropdown-extend-div");
    var button = filter.find("input[type=button]");
    var selAll = filter.find("input[type=checkbox][name=regAll]");
    var selAllLabel = selAll.parent();
    var checkedList = null;
    selAll[0].checked = true;
    for(var i =0 ;i<checkStatusDc.length;i++){
        checkStatusDc[i] = true;
    }

    selAllLabel.click(function () {
        if (selAll[0].checked) {
            $.each(checkedList, function () {
                checkStatusDc[this.value - 1] = this.checked = true;
            });
        } else {
            $.each(checkedList, function () {
                checkStatusDc[this.value - 1] = this.checked = false;
            });
        }
    });
    filterMenu.click(function () {
        //alert("sss");
        var checkIfAllIsChcked = true; 
        $.each(checkedList, function () {
            this.checked = checkStatusDc[this.value - 1];
            if (!checkStatusDc[this.value - 1]) {
                checkIfAllIsChcked = false;
            }          
        });
        selAll[0].checked = checkIfAllIsChcked;
        filter.show();
    });

    filter.mouseleave(function () {
        //alert("sss");
        
        var timeEvent = setTimeout(function () {
            //filter.hide();
            filterClose();
            document.removeEventListener("click", waitForNullClick);
        }, 2000);

        var waitForNullClick = function(){
            //filter.hide();
            filterClose();
            clearTimeout(timeEvent);
            document.removeEventListener("click", waitForNullClick);
        }
        document.addEventListener("click", waitForNullClick);
        //filter.hide();

    });
    
    $.each(dc, function () {

        var div = $("<div></div>").appendTo(listDiv);
        var label = $("<label></label>").appendTo(div);
        var input = $("<input type='checkbox' name='reg' value='" + this.id + "'/>").appendTo(label);
        $("<span> " + this.region + "</span>").appendTo(label);

        checkedList = filter.find("input[type=checkbox][name=reg]");
        });
    button.click(function () {

       // var checkedList = filter.find("input[type=checkbox][name=reg]");
        $.each(checkedList, function () {
           checkStatusDc[this.value - 1] = this.checked;        
        });
        filter.hide();
    });

    var filterClose = function () {
        $.each(checkedList, function () {
            this.checked = checkStatusDc[this.value - 1];
        });
        filter.hide();
    }

 })()
var guid = {
    newGuid: function () {
        var s4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
        return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
    }
};
var utils = {
    getRegions: function (includecdn) {
        var result = dc.slice(0);
        for (var i = dc.length - 1 ; i >= 0; i--) {
            if (!checkStatusDc[i]) {
                result.splice(i,1);
            }
        }
        if (includecdn) {
            return result.concat(cdn);
        }
        return result;
    },
    getGeoList: function () {
        var result = [];
        $.each(utils.getRegions(), function () {
            if (this.geo.indexOf('CDN') == -1 && $.inArray(this.geo, result) == -1) {
                result.push(this.geo);
            }
        });
        return result;
    },
    getSize: function (size, orgUnit, targetUnit, dif) {
        if (!orgUnit) {
            orgUnit = "B";
        }
        if (!targetUnit) {
            targetUnit = "Auto";
        }
        if (dif) {
            size += dif;
        }
        var units = ["B", "KB", "MB", "GB", "TB", "PB"];
        var idx = -1;
        for (idx = 0; idx < units.length; idx++) {
            if (units[idx].toLowerCase() == orgUnit.toLowerCase()) {
                break;
            }
        }
        var dsize = size;
        targetUnit = targetUnit.toLowerCase();
        while (idx < units.length) {
            unit = units[idx];
            idx++;
            if (targetUnit != "auto" && unit.toLowerCase() == targetUnit) {
                break;
            }
            if (targetUnit == "auto" && dsize < 1024) {
                break;
            }
            dsize = dsize / 1024;
        }
        unit = units[idx - 1];
        return { value: Math.round(dsize * 100) / 100 + ' ', unit: unit };
    },
    getSizeStr: function (size, orgUnit, targetUnit, dif) {
        var v = this.getSize(size, orgUnit, targetUnit, dif);
        if (v) {
            return v.value + v.unit;
        }
        return null;
    },
    convertSizeStrToFloat: function (v) {
        var units = ["KB", "MB", "GB", "TB", "PB", "B"];
        var idx = -1;
        var num = 0;
        for (idx = 0; idx < units.length; idx++) {
            if (v.toLowerCase().contains(units[idx].toLowerCase())) {
                num = v.toLowerCase().replace(units[idx].toLowerCase(), '');
                break;
            }
        }
        switch (units[idx].toLowerCase()) {
            case 'b':
                num = parseFloat(num);
                break;
            case 'kb':
                num = parseFloat(num) * 1024;
                break;
            case 'mb':
                num = parseFloat(num) * 1024 * 1024;
                break;
            case 'gb':
                num = parseFloat(num) * 1024 * 1024 * 1024;
                break;
            case 'tb':
                num = parseFloat(num) * 1024 * 1024 * 1024 * 1024;
                break;
            case 'pb':
                num = parseFloat(num) * 1024 * 1024 * 1024 * 1024 * 1024;
                break;
            default:
                break;
        }
        return num;
    }
};
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
angular
    .module('azurespeed')
    .controller('downloadCtrl', ['$scope', '$http', function ($scope, $http) {
        $scope.items = utils.getRegions();
        angular.forEach($scope.items, function (value, key) {
            var data = { region: value.region, blobName: '100MB.bin', operation: 'download' };
            $http.get('/api/sas', { params: data }).success(function (response) {
                console.log(response);
                value.url = response;
            });
        });
    }]);
angular
    .module('azurespeed')
    .controller('latencyCtrl', ['$scope', '$http', function ($scope, $http) {
        
    }]);
angular
    .module('azurespeed')
    .controller('ipRangeCtrl', ['$scope', '$http', function ($scope, $http) {
        $http.get('/api/iprange', {}).success(function (response) {
            $scope.subnetList = response;
        });
    }]);
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
angular
    .module('azurespeed')
    .controller('uploadLargeFileCtrl', ['$scope', '$http', function ($scope, $http) {
        $scope.results = [];
        $scope.regions = utils.getRegions();
        $scope.blockSizes = [256, 512, 1024, 4096];
        $scope.threads = [1, 2, 4, 8, 16];
        $scope.progressNow = 0;
        $scope.progressPercent = 0;
        $scope.selectedBlockSize = 4096;
        $scope.selectedThread = 4;
        $scope.upload = function () {
            var file = $('#file-input')[0].files[0];
            var region = $scope.selectedRegion.region;
            var data = { region: region, blobName: guid.newGuid(), operation: 'upload' };
            $http.get('/api/sas', { params: data }).success(function (response) {
                ja.storage.blockSize = $scope.selectedBlockSize * 1024;
                ja.storage.maxThread = $scope.selectedThread;
                var url = response;
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
                    console.log('loaded = ' + ev.loaded);
                    console.log('total = ' + ev.total);
                    console.log('progressPercent = ' + $scope.progressPercent);
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
                        region: $scope.selectedRegion.region,
                        blockSize: $scope.selectedBlockSize,
                        thread: $scope.selectedThread,
                        speed: $scope.speed
                    });
                };
                var error = function (err) {
                    $scope.error = err;
                };
                blob.upload(file, before, progress, success, error);
            });
        };
        $scope.canUpload = function() {
            return $scope.selectedRegion && $('#file-input')[0].files.length > 0;
        };
    }]);