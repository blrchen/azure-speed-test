$(function () {
    var upload = {
        uploadTable: $('#upload-table'),
        modal: {
            mainPanel: $('#upload-modal'),
            progressbar: $('#progress-bar'),
            errorPanel: $('#error-panel'),
            messagePanel: $('#message-panel'),
            error: function (msg) {
                if (msg) {
                    upload.modal.errorPanel.text(msg).show();
                }
            },
            info: function (msg) {
                if (msg) {
                    upload.modal.messagePanel.text(msg).show();
                }
            },
            setProgress: function (loaded, total) {
                var percent = ((loaded / total) * 100).toFixed(0) + '%';
                upload.modal.progressbar.attr({ 'aria-valuenow': loaded, 'aria-valuemax': total })
                                  .width(percent)
                                  .text(percent);
            },
            resetProgress: function () {
                upload.modal.progressbar.attr({ 'aria-valuenow': 0, 'aria-valuemax': 100 })
                      .width(0)
                      .text(null);
            },
            initControls: function () {
                $.each(utils.getRegionData(true), function () {
                    var opt = $('<option>').val(this.region).text(this.region);
                    $('#region-select').append(opt);
                });
                upload.modal.mainPanel.modal('hide');
                upload.modal.errorPanel.hide();
                upload.modal.messagePanel.hide();
            },
            initEvents: function () {
                $('button[data-action="upload"]').click(function () {
                    upload.modal.errorPanel.empty().hide();
                    upload.modal.messagePanel.empty().hide();
                    upload.modal.resetProgress();

                    var file = upload.modal.mainPanel.find('#file-input')[0].files[0];
                    var blockSize = upload.modal.mainPanel.find('#blocksize-select').val() || 4096;
                    var thread = upload.modal.mainPanel.find('#thread-select').val() || 4;
                    var region = upload.modal.mainPanel.find('#region-select').val();
                    console.log('blockSize = ' + blockSize + ', thread = ' + thread);
                    if (!file) {
                        upload.modal.error("Please select a file");
                        return;
                    } else if (!region) {
                        upload.modal.error("Please select a region");
                        return;
                    }
                    var regions = [];
                    regions.push(region);
                    $.ajax({
                        url: '/Azure/GetSasLinks',
                        type: 'GET',
                        data: { regions: regions, blobName: guid.newGuid(), operations: 'download' },
                        traditional: true,
                        success: function (data) {
                            ja.storage.blockSize = blockSize * 1024;
                            ja.storage.maxThread = thread;
                            var blob = ja.storage.blob(data[0].Url);
                            var st = new Date();
                            var before = function () {
                                st = new Date();
                                console.log('before');
                            };
                            var progress = function (ev) {
                                upload.modal.setProgress(ev.loaded, ev.total);
                            };
                            var success = function () {
                                var elapsedSeconds = (new Date() - st) / 1000;
                                var speed = utils.getSizeStr(file.size / elapsedSeconds) + '/s';
                                upload.modal.info('Upload took ' + elapsedSeconds + ' to complete, speed is ' + speed);
                                var tr = $('<tr>').append($('<td>').text(file.name))
                                                  .append($('<td>').text(file.size))
                                                  .append($('<td>').text(region))
                                                  .append($('<td>').text(blockSize))
                                                  .append($('<td>').text(thread))
                                                  .append($('<td>').text(speed));
                                upload.uploadTable.append(tr);
                                console.log('succ');
                            };
                            var error = function (err) {
                                console.log(err);
                            };
                            blob.upload(file, before, progress, success, error);
                        }
                    });
                });
            },
            init: function () {
                upload.modal.initControls();
                upload.modal.initEvents();
            },
        },
        init: function () {
            upload.modal.init();
        }
    };
    window.upload = upload;
    upload.init();
})