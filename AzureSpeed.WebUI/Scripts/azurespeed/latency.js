$(function() {
    var latency = {
        loop: undefined,
        plot: undefined,
        updateInterval: 3000,
        maxXAxisColumnCount: 20,
        counter: 0,
        data: {},
        locations: {},
        startTime: {},
        average: [],
        refreshed: false,
        plotOption: {
            grid: { aboveData: true, tickColor: 'rgba(0,0,0,0)', labelMargin: 20 },
            series: {
                shadowSize: 0
            },
            yaxis: {
                min: 0
            },
            xaxis: {
                tickSize: 1,
            }
        },
        drawTable: function () {
            var table = $('#latency-table tbody');
            table.empty();
            var tmp = [];
            // todo: change to map
            $.each(utils.getRegionData(false), function () {
                tmp.push({ geozone: this.geozone, region: this.region, location: this.location, average: latency.average[this.storage] });
            });
            tmp.sort(function (a, b) {
                return a.average - b.average;
            });
            var closest = 0;
            var closestable = $('#closest-table');
            closestable.empty();
            $.each(tmp, function () {
                
                var tdGeoZoneRegion = $('<td>').text(this.geozone);
                var tdRegion = $('<td>').text(this.region);
                var tdLocation = $('<td>').text(this.location);
                var tdLatency = $('<td>').text(parseInt(this.average).toFixed(0) + ' ms');
                var tr = $('<tr>').append(tdGeoZoneRegion).append(tdRegion).append(tdLocation).append(tdLatency);
                table.append(tr);
                if (closest < 3) {
                    closest++;
                    var text = this.region +' ( '+this.location+' )';
                    closestable.append($('<tr>').append($('<td>').text(text)).append($('<td>').text(parseInt(this.average).toFixed(0) + ' ms')));
                }
            });
        },
        update: function () {
            latency.counter += 1;
            if (latency.counter == 3) {
                $('#loading').hide();
                $('#placeholder').show();
            }
            latency._getData();
            if (latency.counter >= 3) {
                var d = [];
                $.each(utils.getRegionData(false), function () {
                    var storage = this.storage;
                    d.push(latency.data[storage]);
                    var total = 0;
                    $.each(latency.data[storage], function () {
                        var current = this[1];
                        total += current;
                    });
                    latency.average[storage] = total / latency.data[storage].length;
                    while (latency.data[storage].length > latency.maxXAxisColumnCount) {
                        latency.data[storage].shift();
                    }
                });
                $.plot('#placeholder', d, latency.plotOption);
                latency.drawTable();
            }
            if (latency.counter <= 100) {
                if (latency.refreshed) {
                    latency.refreshed = false;
                    return;
                }
                setTimeout(latency.update, latency.updateInterval);
            }
        },
        _getData: function () {
            $.each(utils.getRegionData(false), function () {
                var storage = this.storage;
                var region = this.region;
                latency.startTime[storage] = new Date().getTime();
                var requestUrl = "http://" + storage + ".blob.core.windows.net/azurespeed/callback.js";
                if (region.indexOf('China') != -1) {
                    requestUrl = "http://" + storage + ".blob.core.chinacloudapi.cn/azurespeed/callback.js";
                }
                if (storage.indexOf('cdn') != -1) {
                    requestUrl = "http://az654246.vo.msecnd.net/azurespeed/callback.js";
                }
                $.ajax({
                    url: requestUrl,
                    type : 'GET',
                    cache: false,
                    success: function(data){
                        latency.callback(storage);
                    }
                });
            });
        },
        callback: function (storage) {
            if (latency.counter >= 3 && latency.counter <= 1200) {
                var elapsed = new Date().getTime() - latency.startTime[storage];
                latency.data[storage].push([latency.counter, elapsed]);
            }
        },
        init: function () {
            $.each(utils.getRegionData(false), function () {
                var storage = this.storage;
                latency.locations[storage] = this.region;
                latency.data[storage] = latency.data[storage] || [];
                latency.average[storage] = 0;
            });
            latency.update();
        }
    };
    window.latency = latency;
    latency.init();
});