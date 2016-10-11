$(function () {
    // TODO: rewrite with angular code
    var latency = {
        pingCount: 0,
        maxPingCount: 180,
        lineChartHeight: 240,
        lineChartWidth: $('.chart-container').width(),
        updateInterval: 2000,
        history: {},
        startTime: {},
        latest: [],
        average: [],
        report: function () {
            var table = $('#latency-table tbody');
            table.empty();
            var tmpRegions = [];
            $.each(utils.getRegions(), function () {
                tmpRegions.push({ geo: this.geo, name: this.name, location: this.location, average: latency.latest[this.storage] });
            });

            $.each(tmpRegions, function () {
                if (this.average > 0) {
                    var tdGeo = $('<td>').text(this.geo);
                    var tdRegion = $('<td>').text(this.name);
                    var tdLocation = $('<td>').text(this.location);
                    var tdLatency = $('<td>').text(parseInt(this.average).toFixed(0) + ' ms');
                    var tr = $('<tr>').append(tdGeo).append(tdRegion).append(tdLocation).append(tdLatency);
                    table.append(tr);
                }
            });
            var closestTable = $('#closest-table');
            closestTable.empty();
            tmpRegions.sort(function (a, b) {
                return a.average - b.average;
            });
            var closest = 0;
            $.each(tmpRegions, function () {
                if (closest < 3) {
                    closest++;
                    var text = this.name + ' ( ' + this.location + ' )';
                    closestTable.append($('<tr>').append($('<td>').text(text)).append($('<td>').text(parseInt(this.average).toFixed(0) + ' ms')));
                }
            });
            setTimeout(latency.report, latency.updateInterval);
        },
        pingloop: function () {
            if (latency.pingCount < latency.maxPingCount) {
                latency._ping();
                setTimeout(latency.pingloop, latency.updateInterval);
                latency.pingCount++;
            }
        },
        _ping: function () {
            $.each(utils.getRegions(), function () {
                latency.startTime[this.storage] = new Date().getTime();
                var requestUrl = this.endpointSuffic
                    ? 'http://' + this.storage + '.blob.' + this.endpointSuffic + '/public/callback.js'
                    : 'http://' + this.storage + '.blob.core.windows.net/public/callback.js';
                $.ajax({
                    url: requestUrl,
                    type: 'GET',
                    cache: false
                });
            });
        },
        _pingCallback: function (storage) {
            var elapsed = new Date().getTime() - latency.startTime[storage];
            latency.history[storage].push(elapsed);
            latency.latest[storage] = elapsed;
        },
        tickloop: function () {
            var n = 60,                                 //number of x coordinates in the graph
                duration = 600,                          //duration for transitions
                now = new Date(Date.now() - duration),   //Now
                //fill an array of arrays with dummy data to start the chart
                //each item in the top-level array is a line
                //each item in the line arrays represents the X coordinate across a graph
                //The 'value' within each line array represents the Y coordinate for that point
                data = [
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; }),
                    d3.range(n).map(function () { return { value: 0 }; })
                ];

            // Auto generate color
            var color = d3.scale.category10();
            var colorDomain = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'];
            color.domain(colorDomain);

            //set margins and figure out width/height
            var margin = { top: 6, right: 40, bottom: 20, left: 40 },
                width = latency.lineChartWidth - margin.left - margin.right,
                height = latency.lineChartHeight - margin.top - margin.bottom;

            //the time scale for the X axis
            var x = d3.time.scale()
                           .domain([now - (n - 2) * duration, now - duration])
                           .range([0, width]);

            //the numerical scale for the Y axis
            var y = d3.scale.linear()
                            .domain([500, 0])
                            .range([0, height]);

            var line = d3.svg.line()
                             .interpolate('basis')
                             .x(function (d, i) { return x(now - (n - 1 - i) * duration); })
                             .y(function (d, i) { return y(d.value); });

            var svg = d3.select('.chart-container')
                        .append('svg')
                        .attr('width', width + margin.left + margin.right)
                        .attr('height', height + margin.top + margin.bottom)
                        .append('g')
                        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            //Define a clipping path, because we need to clip the graph to render only the bits we want to see as it moves
            svg.append('defs')
               .append('clipPath')
               .attr('id', 'clip')
               .append('rect')
               .attr('width', width)
               .attr('height', height);

            //Append the x axis
            var axis = svg.append('g')
                          .attr('class', 'x axis')
                          .attr('transform', 'translate(0,' + height + ')')
                          .call(x.axis = d3.svg.axis()
                          .scale(x)
                          .orient('bottom'));

            //append the y axis
            var yaxis = svg.append('g')
                           .attr('class', 'y axis')
                           .call(y.axis = d3.svg.axis().scale(y)
                           .orient('left')
                           .ticks(5));

            //append the clipping path
            var linegroup = svg.append('g')
                               .attr('clip-path', 'url(#clip)');

            var path = linegroup.selectAll('.line')
                                .data(data)
                                .enter()
                                .append('path')
                                .attr('class', 'line')
                                .attr('d', line)
                                .style('stroke', function (d, i) { return color(i); });

            //We need to transition the graph after all lines have been updated. There's no
            //built-in for this, so this function does reference counting on end events
            //for each line, then applies whatever callback when all are finished.
            function endall(transition, callback) {
                var n = 0;
                transition
                    .each(function () { ++n; })
                    .each('end', function () { if (!--n) callback.apply(this, arguments); });
            }

            tick();

            function tick() {
                // update the domains
                now = new Date();
                x.domain([now - (n - 2) * duration, now - duration]);

                // fill new data
                $.each(utils.getRegions(), function () {
                    var storage = this.storage;
                    if (latency.latest[storage] > 0) {
                        data[this.id].push({ value: latency.latest[storage] });
                    }
                });

                //slide the x-axis left
                axis.transition()
                    .duration(duration)
                    .ease('linear')
                    .call(x.axis);

                //Update the paths based on the updated line data and slide left
                path.attr('d', line)
                    .attr('transform', null)
                    .transition()
                    .duration(duration)
                    .ease('linear')
                    .attr('transform', 'translate(' + x(now - (n - 1) * duration) + ',0)')
                    .call(endall, tick);

                for (var i = 0; i < data.length; i++) {
                    data[i].shift();
                };
            };
        },
        init: function () {
            $.each(regions, function () {
                var storage = this.storage;
                latency.latest[storage] = 0;
                latency.history[storage] = latency.history[storage] || [];
                latency.average[storage] = 0;
            });
            latency.pingloop();
            latency.tickloop();
            latency.report();
        }
    };
    window.latency = latency;
    latency.init();
});