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