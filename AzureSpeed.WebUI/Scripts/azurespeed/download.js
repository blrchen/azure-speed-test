$(function () {
    var download = {
        _initDownloadTable: function () {
            var column = [
                { name: 'Geo Zone' },
                { name: 'Region' },
                { name: 'Location' },
                { name: 'Test File' }
            ];
            var table = $('#download-table'),
                thead = $('<thead>').appendTo(table),
                tr = $('<tr>').appendTo(thead);
            $.each(column, function () {
                tr.append($('<th>').html(this.name));
            });
            var tbody = $('<tbody>').appendTo(table);
            $.each(utils.getRegionData(false), function () {
                var region = this.region;
                var regions = [];
                regions.push(this.region);
                var link = $('<a>').text('Download 100MB File');
                if (region.indexOf('CDN') < 0) {
                    $.ajax({
                        url: '/Azure/GetSasLinks',
                        type: 'GET',
                        data: { regions: regions, blobName: '100MB.bin', operations: 'download' },
                        traditional: true,
                        success: function (data) {
                            link.attr("href", data[0].Url);
                        }
                    });
                }
                else {
                    link.attr("href", "http://az654246.vo.msecnd.net/azurespeed/100MB.bin");
                }
                var row = $('<tr>');
                row.append($('<td>').html(this.geozone));
                row.append($('<td>').html(this.region));
                row.append($('<td>').html(this.location));
                row.append($('<td>').html(link));
                row.appendTo(tbody);
            });
        },
        init: function () {
            download._initDownloadTable();
        }
    };
    window.download = download;
    download.init();
})