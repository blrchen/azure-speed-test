$(function () {
    var upload = {
        byteSize: 256 * 1024,
        content: [],
        targets: [],
        regionData: [],
        geoZoneList: {},
        geoZoneGroup: $('#geozone-group'),
        uploadTable: $('#upload-table'),
        upload: function () {
            if (upload.targets.length > 0) {
                var storage = upload.targets[0].Storage;
                var url = upload.targets[0].Url;
                //      var container = ja.storage.container(url);
                //      var blob = container.getBlob(guid.newGuid());
                var blob = ja.storage.blob(url);
                var st = new Date();
                var before = function () {
                    console.log(storage + ' upload starts');
                    upload.uploadTable.find('td.upload-speed').addClass('speed-inprogress');
                    st = new Date();
                };
                var progress = function (ev) {
                    var percent = ((ev.loaded / ev.total) * 100).toFixed(0) + '%';
                    upload.uploadTable.find('tr[name="' + storage + '"] td.upload-progress >div >div').css('width', percent).text(percent);
                    upload.uploadTable.find('tr[name="' + storage + '"] td.upload-speed').text('Test in progress');
                    console.log(storage + ' upload in progress ' + percent + '%');
                };
                var success = function () {
                    var elapsedSeconds = (new Date() - st) / 1000;
                    var speed = utils.getSizeStr(upload.byteSize / elapsedSeconds) + '/s';
                    upload.uploadTable.find('tr[name="' + storage + '"] td.upload-speed')
                                      .removeClass('speed-inprogress')
                                      .addClass('speed-success').text(speed);
                    console.log(storage + ' upload completed successfully, speed = ' + speed);
                    upload.sortTable();
                    upload.targets.shift();
                    if (upload.targets.length > 0) {
                        upload.upload();
                    }
                };
                var error = function (err) {
                    upload.uploadTable.find('tr[name="' + storage + '"] td.upload-speed').text('upload completed with error');
                    console.log(storage + ' upload completed with error' + err);
                };
                blob.upload(upload.content, before, progress, success, error);
            }
        },
        sortTable: function () {
            var table = $("#result-table tbody"),
                tmp = [];
            $.each(table.find('tr'), function () {
                var t = this;
                var num = parseInt($(t).find('.sort').text());
                var row = t;
                tmp.push({ num: num, html: row.outerHTML });
                $(t).remove();
            });
            tmp.sort(function (a, b) {
                return a.num > b.num;
            });
            $.each(tmp, function () {
                var t = this;
                table.append(t.html);
            });
        },
        drawTable: function () {
            upload.uploadTable.find('tbody').empty();
            $.each(upload.regionData, function () {
                if (upload.geoZoneList[this.geozone]) {
                    var tr = $('<tr>').attr('name', this.storage)
                                      .append($('<td>').text(this.geozone))
                                      .append($('<td>').text(this.region))
                                      .append($('<td>').text(this.location))
                                      .append($('<td>').addClass('upload-progress'))
                                      .append($('<td>').addClass('upload-speed sort'));
                    upload.uploadTable.find('tbody:last').append(tr);
                }
            });
            var progressIn = $('<div>').addClass('progress-bar progress-bar-info');
            var progress = $('<div>').addClass('progress').css('margin-bottom', -20).append(progressIn);
            upload.uploadTable.find('td.upload-progress').append(progress);
        },
        initControls: function () {
            if (!upload.content || upload.content.length == 0) {
                for (var i = 0; i < upload.byteSize; i++) {
                    upload.content.push('.');
                }
            }
            $.each(utils.getGeoZoneList(), function () {
                var t = this;
                var input = $('<input>').attr('type', 'checkbox')
                                        .attr('checked', '')
                                        .val(t)
                                        .on('change', function () {
                                            upload.geoZoneList[t] = !upload.geoZoneList[t];
                                            upload.drawTable();
                                        });
                var l = $('<label>').addClass('checkbox-inline').append(input).append(t);
                upload.geoZoneGroup.append(l);
            });
            upload.drawTable();
        },
        initEvents: function () {
            $('button[data-action="upload"]').click(function () {
                var regions = [];
                $.each(upload.regionData, function () {
                    if (upload.geoZoneList[this.geozone]) {
                        regions.push(this.region);
                    }
                });
                $.ajax({
                    url: '/Azure/GetSasLinks',
                    type: 'GET',
                    data: { regions: regions, blobName: guid.newGuid(), operations: 'upload' },
                    traditional: true,
                    success: function (data) {
                        upload.targets = data;
                        upload.upload();
                    }
                });
            });
        },
        init: function () {
            upload.regionData = utils.getRegionData(true);
            // todo: do we really need this?
            $.each(upload.regionData, function () {
                if (upload.geoZoneList && !upload.geoZoneList[this.geozone]) {
                    upload.geoZoneList[this.geozone] = true;
                }
            });
            upload.initControls();
            upload.initEvents();
        }
    };
    window.upload = upload;
    upload.init();
})