(function (jAzure, $, global) {
    var ja = jAzure, storage = ja.storage, web = ja.storage.web;
    //extend ja.storage.account
    $.extend(ja.storage.account.prototype, {
        getContainer: function (containerName) {
            var c = container(null);
            ja.defineReadonlyProperties(c, {
                Name: containerName,
                Url: this.BlobUrl + containerName
            });
            c.web = this.web;
            return c;
        },
        listContainers: function (options, success, error) {
            var params = $.extend({}, options, { comp: 'list' }), t = this;
            var convertor = function (data) {
                var list = [], containers = data.Containers.Container;
                if ($.isArray(containers)) {
                    var len = containers.length;
                    for (var idx = 0; idx < len; idx++) {
                        var c = t.getContainer(containers[idx].Name);
                        c.Properties = containers[idx].Properties;
                        list.push(c);
                    }
                } else {
                    var c = t.getContainer(containers.Name);
                    c.Properties = containers.Properties;
                    list.push(c);
                }
                return list;
            };
            this.web.request(this.BlobUrl, 'GET', params, {
                convertor: convertor,
                success: success,
                error: error
            }).send();
        }
    });
    //containers
    var container = function (sas) {
        return new container.prototype.init(sas);
    };

    var metaPrefix = 'x-ms-meta-';
    var propertiesMap = {
        'Etag': 'ETag',
        'Last_Modified': 'Last-Modified',
        'LeaseState': 'x-ms-lease-state',
        'LeaseStatus': 'x-ms-lease-status',
        'LeaseDuration': 'x-ms-lease-duration'
    };

    container.prototype = {
        init: function (sas) {
            ja.defineReadonlyProperties(this, { SAS: sas });
            if (sas && sas.indexOf('http') == 0) {
                ja.defineReadonlyProperties(this, { Url: sas });
            }
            this.web = web(sas);
            return this;
        }, getSas: function (options) {
            surl = ja.storage.splitUrl(this.Url);
            var op = $.extend({}, options, {
                resourceType: 'c',
                resourceName: '/' + ja.storage.joinUrl(surl.accountName, surl.containerName)
            });
            return this.web.getSas(op);
        }, getSasUri: function (options) {
            var sas = this.getSas(options), surl = ja.storage.splitUrl(this.Url);
            return ja.storage.joinUrl(surl.endpoint, surl.containerName) + sas;
        }, create: function (success, error) {
            this.web.request(this.Url, 'PUT', { restType: 'container' }).send(success, error);
        }, 'delete': function (success, error) {

        }, getProperties: function (success, error) {
            var t = this;
            t.web.request(this.Url, 'GET', { restype: 'container' })
                .send(function (data, sta, xhr) {
                    var p = {};
                    for (var n in propertiesMap) {
                        p[n] = xhr.getResponseHeader(propertiesMap[n]);
                    }
                    t.Properties = p;
                    if (success) {
                        success.call(t, t.Properties);
                    }
                }, error);
        }, getMetadata: function (success, error) {
            var t = this;
            t.web.request(this.Url, 'GET', { restype: 'container', comp: 'metadata' },
                {
                    success: function (data, sta, xhr) {
                        t.Metadata = xhr.getResponseHeaders(metaPrefix);
                        if (success) {
                            success.call(t, t.Metadata);
                        }
                    }, error: error
                }).send();
        }, setMetadata: function (metadata, success, error) {
            if (metadata) {
                var t = this;
                t.web.reqeust(this.Url, 'PUT',
                    { restype: 'container', comp: 'metadata' },
                    {
                        before: function (xhr) {
                            for (n in metadata) {
                                xhr.setRequestHeader(metaPrefix + n, metadata[n]);
                            }
                        }, success: success,
                        error: error
                    }).send();
            }
        }, getACL: function (success, error) {
            var t = this;
            t.web.request(this.Url, 'GET',
                { restype: 'container', comp: 'acl' },
                {
                    success: function (data, sta, xhr) {
                        var acl = {};
                        acl.PublicAccess = xhr.getResponseHeader('x-ms-blob-public-access');
                        acl.SignedIdentifiers = data;
                        t.ACL = acl;
                        if (success) {
                            success.call(t, t.ACL);
                        }
                    }, error: error
                }).send();
        }, setACL: function (acl, success, error) {
            if (acl) {
                var headers = { 'Content-Type': ', text/plain;charset=UTF-8' };
                if (acl.PublicAccess) {
                    headers['x-ms-blob-public-access'] = acl.PublicAccess;
                }
                this.web.request(this.Url,
                    'PUT',
                    { restype: 'container', comp: 'acl' },
                    {
                        headers: headers,
                        data: $.json2xml({ SignedIdentifiers: acl.SignedIdentifiers }),
                        success: success,
                        error: error
                    }).send();
            }
        }, lease: function (success, error) {
            alert('lease is comming...');
        }
    };
    container.prototype.init.prototype = container.prototype;

    jAzure.storage.container = container;
})(jAzure, jQuery, window);