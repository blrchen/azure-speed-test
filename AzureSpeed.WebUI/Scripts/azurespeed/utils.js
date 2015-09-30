var guid = {
    newGuid: function () {
        var s4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); };
        return (s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4());
    }
};
var utils = {
    cdn: [{ id: 0, name: 'cdn', storage: 'cdn', geozone: 'CDN', region: 'CDN', location: 'CDN', color: '#333' }],
    datacenters: [
            { id: 1, name: 'eastus', storage: 'azspeastus', geozone: 'United States', region: 'East US', location: 'Virginia' },
            { id: 2, name: 'eastus2', storage: 'azspeastus2', geozone: 'United States', region: 'East US 2', location: 'Virginia' },
            { id: 3, name: 'westus', storage: 'azspwestus', geozone: 'United States', region: 'West US', location: 'California' },
            { id: 4, name: 'centralus', storage: 'azspcentralus', geozone: 'United States', region: 'Central US', location: 'Iowa' },
            { id: 5, name: 'southcentralus', storage: 'azspsouthcentralus', geozone: 'United States', region: 'South Central US', location: 'Texas' },
            { id: 6, name: 'northcentralus', storage: 'azspnorthcentralus', geozone: 'United States', region: 'North Central US', location: 'Illinois' },
            { id: 7, name: 'northeurope', storage: 'azspnortheurope', geozone: 'Europe', region: 'North Europe', location: 'Ireland' },
            { id: 8, name: 'westeurope', storage: 'azspwesteurope', geozone: 'Europe', region: 'West Europe', location: 'Netherlands' },
            { id: 9, name: 'eastasia', storage: 'azspeastasia', geozone: 'Asia Pacific', region: 'East Asia', location: 'Hong Kong' },
            { id: 10, name: 'southeastasia', storage: 'azspsoutheastasia', geozone: 'Asia Pacific', region: 'Southeast Asia', location: 'Singapore' },
            { id: 11, name: 'japaneast', storage: 'azspjapaneast', geozone: 'Japan', region: 'Japan East', location: 'Saitama Prefecture' },
            { id: 12, name: 'japanwest', storage: 'azspjapanwest', geozone: 'Japan', region: 'Japan West', location: 'Osaka Prefecture' },
            { id: 13, name: 'chinaeast', storage: 'azspchinaeast', geozone: 'China', region: 'China East', location: 'Shanghai' },
            { id: 14, name: 'chinanorth', storage: 'azspchinanorth', geozone: 'China', region: 'China North', location: 'Beijing' },
            { id: 15, name: 'brazilsouth', storage: 'azspbrazilsouth', geozone: 'Brazil', region: 'Brazil South', location: 'Sao Paulo State' },
            { id: 16, name: 'australiaeast', storage: 'azspaustraliaeast', geozone: 'Australia', region: 'Australia East', location: 'New South Wales' },
            { id: 17, name: 'australiasoutheast', storage: 'azspaustraliasoutheast', geozone: 'Australia', region: 'Australia Southeast', location: 'Victoria' },
            { id: 18, name: 'centralindia', storage: 'azspcentralindia', geozone: 'India', region: 'Central India', location: 'Pune' },
            { id: 19, name: 'azspsouthindia', storage: 'azspsouthindia', geozone: 'India', region: 'South India', location: 'Chennai' },
            { id: 20, name: 'westindia', storage: 'azspwestindia', geozone: 'India', region: 'West India', location: 'Mumbai' }
    ],
    getRegionData: function (includecdn) {
        var regiondata = utils.datacenters;
        if (includecdn) {
            return regiondata.concat(utils.cdn);
        }
        return regiondata;
    },
    getGeoZoneList: function () {
        var geoZoneList = [];
        $.each(utils.getRegionData(), function () {
            if (this.geozone.indexOf('CDN') == -1 && $.inArray(this.geozone, geoZoneList) == -1) {
                geoZoneList.push(this.geozone);
            }
        });
        return geoZoneList;
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
