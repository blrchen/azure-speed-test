(function (jAzure, $, global) {
    var pageBlobType = 'PageBlob'
        , blockBlobType = 'BlockBlob'
        , ja = jAzure
        , storage = ja.storage
        , container = ja.storage.container
        , web = ja.storage.web;

    var blobConvertor = function (obj, blobs) {
        if (blobs) {
            var list = [];
            if (!$.isArray(blobs)) {
                blobs = [blobs];
            }
            var prefix = (obj instanceof container) ? '' : obj.FullName;
            var len = blobs.length;
            for (var idx = 0; idx < len; idx++) {
                var item = blobs[idx];
                var name = item.Name.substring(prefix.length);
                var b = obj.getBlob(name, item.Properties.BlobType);
                b.Properties = item.Properties;
                b.web = obj.web;
                list.push(b);
            }
            return list;
        }
        return [];
    }, directoryConvertor = function (obj, directories) {
        if (directories) {
            var list = [];
            if (!$.isArray(directories)) {
                directories = [directories];
            }
            var len = directories.length;
            var purl = splitUrl(obj.Url);
            for (var idx = 0; idx < len; idx++) {
                var url = joinUrl(purl.endpoint, purl.containerName, directories[idx].Name, purl.sas);
                var c = directory(url);
                c.web = obj.web;
                list.push(c);
            }
            return list;
        }
        return [];
    }, splitUrl = ja.storage.splitUrl,
    joinUrl = ja.storage.joinUrl,
    readableSize = function (value) {
        if (!value) {
            return value;
        }
        var units = ["B", "KB", "MB", "GB", "TB", "PB"];
        if (typeof (value) == 'string') {
            value = parseInt(value);
        }
        for (var idx = 0; idx < units.length; idx++) {
            if (value < 1024) {
                return value.toFixed(2) + units[idx];
            }
            value = value / 1024;
        }
        return value;
    };
    //extend container prototype
    $.extend(container.prototype, {
        listBlobs: function (options, success, error) {
            if (typeof (options) == "function") {
                error = success;
                success = options;
                options = null;
            }
            options = options || {};
            options.restype = 'container';
            options.comp = 'list';
            var t = this;
            var convertor = function (data) {
                var result = {};
                result.blobs = blobConvertor(t, data.Blobs.Blob);
                result.directories = directoryConvertor(t, data.Blobs.BlobPrefix);
                result.nextMarker = data.NextMarker;
                result.prefix = data.Prefix;
                return result;
            };
            this.web.request(this.Url, 'GET', options, {
                convertor: convertor,
                success: success,
                error: error
            }).send();
        },
        children: function (options, success, error) {
            if (typeof (options) == "function") {
                error = success;
                success = options;
                options = {};
            }
            $.extend(options, { delimiter: '/' });
            return this.listBlobs.call(this, options, success, error);
        },
        getDirectory: function (name) {
            var p = splitUrl(this.Url);
            url = joinUrl(p.endpoint, p.containerName, name + p.sas);
            var d = directory(url);
            d.web = this.web;
            return d;
        },
        getBlob: function (blobName, blobType) {
            if (!blobType) {
                blobType = blockBlobType;
            }
            if (blobType != pageBlobType && blobType != blockBlobType) {
                throw 'the blob type can only be ' + blockBlobType + ' or ' + pageBlobType + ', by default is ' + blockBlobType + '.';
            }
            var p = splitUrl(this.Url);
            var url = joinUrl(p.endpoint, p.containerName, blobName + p.sas);
            var b = blob(url, blobType);
            b.web = this.web;
            return b;
        },
        getBlockBlob: function (blobName) {
            return this.getBlob(blobName, blockBlobType);
        },
        getPageBlob: function (blobName) {
            return this.getPageBlob(blobName, pageBlobType);
        }
    });

    var directory = function (url) {
        return new directory.prototype.init(url);
    };

    directory.prototype = {
        init: function (url) {
            var surl = splitUrl(url);
            var fullName = surl.blobName;
            var url = joinUrl(surl.endpoint, surl.containerName, surl.sas);
            var path = fullName.replace(/^\/|\/?$/g, "");
            var name = path.substring(path.lastIndexOf('/') + 1);
            ja.defineReadonlyProperties(this, { Url: url, Name: name, FullName: fullName });
            this.web = web();
            return this;
        }, getBlob: function (blobName, blobType) {
            blobName = joinUrl(this.FullName, blobName);
            return container.prototype.getBlob.call(this, blobName, blobType);
        }, getBlockBlob: function (blobName) {
            return this.getBlob(blobName, blockBlobType);
        }, getPageBlob: function (blobName) {
            return this.getBlob(blobName, pageBlobType);
        }, listBlobs: function (options, success, error) {
            var op = {};
            if (typeof (options) == 'object') {
                $.extend(op, options);
            } else if (typeof (options) == 'function') {
                error = success;
                success = options;
            }
            op.prefix = joinUrl(this.FullName, (op.prefix || ''));
            return container.prototype.listBlobs.call(this, op, success, error);
        }, getDirectory: function (name) {
            name = joinUrl(this.FullName, name, '/');
            return container.prototype.getDirectory.call(this, name);
        }, children: function (options, success, error) {
            var op = {};
            if (typeof (options) == 'object') {
                $.extend(op, options);
            } else if (typeof (options) == 'function') {
                error = success;
                success = options;
            }
            op.delimiter = '/';
            return this.listBlobs(op, success, error);
        }, parent: function () {
            var fullName = this.FullName.replace(/^\/|\/?$/g, "");
            if (fullName.indexOf('/') < 0) {
                return null;
            } else {
                var surl = splitUrl(this.Url), snames = fullName.split('/'), pname = snames.slice(0, snames.length - 1).join('/');
                var url = joinUrl(surl.endpoint, surl.containerName, pname, surl.sas);
                var p = directory(url);
                p.web = this.web;
                return p;
            }
        }
    };
    directory.prototype.init.prototype = directory.prototype;

    //blobs
    var blob = function (url, type) {
        return new blob.prototype.init(url, type);
    };
    var metaPrefix = 'x-ms-meta-';
    var propertiesMap = {
        'BlobType': 'x-ms-blob-type',
        'Cache_Control': 'Cache-Control',
        'Content_Disposition': 'Content-Disposition',
        'Content_Encoding': 'Content-Encoding',
        'Content_Language': 'Content-Language',
        'Content_Length': 'Content-Length',
        'Content_MD5': 'Content-MD5',
        'Content_Type': 'Content-Type',
        'Etag': 'Etag',
        'Last_Modified': 'Last-Modified',
        'LeaseState': 'x-ms-lease-state',
        'LeaseStatus': 'x-ms-lease-status'
    };
    blob.prototype = {
        init: function (url, type) {
            var surl = splitUrl(url),
                fullName = surl.blobName,
                shortName = fullName.substring(fullName.lastIndexOf('/') + 1),
                extension = shortName.indexOf('.') >= 0 ? shortName.substring(shortName.lastIndexOf('.') + 1) : '';
            ja.defineReadonlyProperties(this,
                {
                    Url: url,
                    BlobType: type,
                    Name: shortName,
                    FullName: fullName,
                    Extension: extension
                });
            if (surl.sas) {
                ja.defineReadonlyProperties(this, { 'sas': url });
            }
            this.web = web();
            return this;
        },
        getSas: function (options) {
            surl = ja.storage.splitUrl(this.Url);
            var op = $.extend({}, options, {
                resourceType: 'b',
                resourceName: '/' + ja.storage.joinUrl(surl.accountName, surl.containerName, this.FullName)
            });
            return this.web.getSas(op);
        },
        getSasUri: function (options) {
            var sas = this.getSas(options), surl = ja.storage.splitUrl(this.Url);
            return ja.storage.joinUrl(surl.endpoint, surl.containerName, this.FullName) + sas;
        },
        size: function (readable) {
            var v = parseInt(this.Properties.Content_Length, 10);
            return readable === false ? v : readableSize(v);
        },
        put: function (file, success, error) {
            this.upload(file, null, null, success, error);
        },
        get: function (success, error) {
            this.download();
        },
        snapshot: function (metadata, success, error) {
            if (typeof (metadata) == 'function') {
                error = success;
                success = metadata;
                metadata = null;
            }
            var headers = {};
            if (metadata) {
                for (n in metadata) {
                    headers['x-ms-meta-' + n] = metadata[n];
                }
            }
            this.web.request(this.Url, 'PUT', { comp: 'snapshot' },
                {
                    headers: headers,
                    success: success,
                    error: error
                }).send();
        },
        copy: function (sourceBlob, options, success, error) {
            if (typeof (options) == success) {
                error = success;
                success = options,
                options = null;
            }
            var headers = { 'x-ms-copy-source': sourceBlob };
            if (options) {
                for (n in options) {
                    if (n == 'metadata') {
                        var metadata = options[n];
                        for (m in metadata) {
                            headers['x-ms-meta-' + m] = metadata[m];
                        }
                    }
                    else {
                        headers[n] = options[n];
                    }
                }
            }
            var t = this;
            t.web.request(this.Url, 'PUT', null,
                {
                    headers: headers,
                    success: function (data, sta, xhr) {
                        return {
                            copyId: xhr.getResponseHeader('x-ms-copy-id'),
                            copyStatus: xhr.getResponseHeader('x-ms-copy-status')
                        };
                    },
                    error: error
                }).send();
        },
        abortCopy: function (copyId, success, error) {
            var headers = { 'x-ms-copy-action': 'abort' };
            this.web.request(this.Url, 'PUT', { comp: 'copy', copyid: copyId }, {
                headers: headers,
                success: success,
                error: error
            }).send();
        },
        getBlockList: function (blockListType, snapshot, success, error) {
            if (typeof (blockListType) == 'function') {
                success = blockListType;
                error = snapshot;
                blockListType = 'committed';
                snapshot = null;
            }
            else if (typeof (snapshot) == 'function') {
                error = success;
                success = snapshot;
                snapshot = 0;
            }
            if (this.BlobType != blockBlobType) {
                throw 'The function only available for block blob';
            }
            if (['committed', 'uncommitted', 'all'].indexOf(blockListType) == -1) {
                throw 'The block list type can only be "committed","uncommitted" or "all".';
            }
            var params = { 'comp': 'blocklist', 'blocklisttype': blockListType };
            if (snapshot) {
                params['snapshot'] = snapshot;
            }
            this.web.request(this.Url, 'GET', params).send(success, error);
        },
        getPageRanges: function () {
            //todo:get page range...
        },
        upload: function (file, before, progress, success, error) {
            var arglen = arguments.length;
            if (arglen == 2 || arglen == 3) {
                success = before;
                error = progress;
            }
            else if (arglen == 4) {
                success = before;
                error = success;
                progress = before;
            }
            if (!(file instanceof File)) {
                if ($.isArray(file)) {
                    file = new Blob(file);
                } else {
                    if (typeof (file) == 'object') {
                        file = new Blob([JSON.stringify(file)]);
                    } else {
                        file = new Blob([file]);
                    }
                }
            }
            uploader.enqueueBlob(this, file, before, progress, success, error);
            uploader.enqueueErrorBlocks(blob);
            uploader.upload();
        }, download: function () {
            var id = 'ja-blob-download-frame-';
            var frame = document.getElementById(id);
            if (frame == null) {
                frame = document.createElement('iframe');
                frame.id = id;
                frame.style.display = 'none';
                document.body.appendChild(frame);
            }
            if (this.sas) {
                frame.src = this.sas;
            } else {
                var d = new Date(), s = new Date(d.getTime() - 5 * 60 * 1000), e = new Date(d.getTime() + 3 * 60 * 1000);
                frame.src = this.getSasUri({ permission: 'r', startTime: s, endTime: e });
            }
        }, 'delete': function (success, error) {
            this.web.request(this.Url, 'DELETE').send(success, error);
        }, setMetadata: function (metadata, success, error) {
            if (metadata) {
                var headers = {};
                for (n in metadata) {
                    headers[metaPrefix + n] = metadata[n];
                };
                this.web.request(this.Url, 'PUT', { comp: 'metadata' }, {
                    headers: headers
                    , success: success
                    , error: error
                }).send();
            }
        }, setProperties: function (properties, success, error) {
            if (properties) {
                var headers = {};
                for (n in properties) {
                    headers[propertiesMap[n]] = properties[n];
                }
                this.web.request(this.Url, 'PUT', { comp: 'properties' }, {
                    headers: headers,
                    success: success,
                    error: error
                }).send();
            }
        }, getMetadata: function (success, error) {
            var t = this;
            t.web.request(this.Url, 'GET', { comp: 'metadata' }, {
                before: function (xhr) {
                },
                success: function (data, sta, xhr) {
                    t.Metadata = ja.getResponseHeaders(xhr, metaPrefix);
                    if (success) {
                        success.call(t, t.Metadata);
                    }
                }, error: error
            }).send();
        }, getProperties: function (success, error) {
            var t = this;
            t.web.request(this.Url, 'HEAD', null, {
                success: function (data, sta, xhr) {
                    var p = {};
                    for (var n in propertiesMap) {
                        p[n] = xhr.getResponseHeader(propertiesMap[n]);
                    }
                    t.Properties = p;
                    if (success) {
                        success.call(t, t.Properties);
                    }
                }, error: error
            }).send();
        }
    };

    blob.prototype.init.prototype = blob.prototype;

    //used to create block id.
    function pad(number, length) {
        var str = '' + number;
        while (str.length < length) {
            str = '0' + str;
        }
        return str;
    };
    var block = function (cp) {
        this.cp = cp;
        this.pointer = cp.pointer;
        this.content = cp.file.slice(this.pointer, this.pointer + ja.storage.blockSize);
        this.id = btoa("block-" + pad(cp.blocks.length, 6)).replace(/=/g, 'a');
        this.size = this.content.size;
        this.loaded = 0;
    };
    block.prototype = {
        upload: function () {
            var t = this, reader = new FileReader(), cp = this.cp, web = cp.blob.web;
            reader.onloadend = function (ev) {
                if (ev.target.readyState == FileReader.DONE) {
                    var data = new Uint8Array(ev.target.result);
                    web.request(cp.blob.Url, 'PUT'
                        , { comp: 'block', blockid: t.id }
                        , {
                            data: data,
                            processData: false,
                            headers: { 'x-ms-blob-type': cp.blob.BlobType, 'Content-Type': cp.type },
                            before: function (xhr) {
                                if (!cp.send) {
                                    if (cp.before) {
                                        cp.before.apply(cp.blob, arguments);
                                    }
                                }
                                cp.send = true;
                            }, progress: function (ev) {
                                cp.loaded += (ev.loaded - t.loaded);
                                t.loaded = ev.loaded;
                                if (cp.progress) {
                                    cp.progress.call(cp.blob, { loaded: cp.loaded, total: cp.size });
                                }
                            }, success: function () {
                                if (cp.loaded == cp.size) {
                                    uploader.commit(cp);
                                }
                                uploader.threads--;
                                uploader.upload();
                            }, error: function () {
                                cp.loaded -= t.loaded;
                                cp.errorBlocks.push(t);
                                if (cp.error) {
                                    cp.error.apply(cp.blob, arguments);
                                }
                                uploader.threads--;
                                uploader.upload();
                            }
                        }).send();
                }
            };
            reader.readAsArrayBuffer(t.content);
        }
    };
    var uploader = {
        blobQueue: {},
        blockQueue: [],
        threads: 0,
        enqueueBlob: function (blob, file, before, progress, success, error) {
            if (!this.blobQueue[blob.Url]) {
                var cp = {};
                cp.blob = blob;
                cp.send = false;
                cp.pointer = 0;
                cp.file = file;
                cp.size = file.size;
                cp.loaded = 0;
                cp.type = file.type;
                cp.before = before;
                cp.progress = progress;
                cp.success = success;
                cp.error = error;
                cp.blocks = [];
                cp.errorBlocks = [];
                this.blobQueue[blob.Url] = cp;
            }
        },
        hasBlob: function (blob) {
            return !!this.blobQueue[blob.Url];
        },
        dequeueBlob: function (blob) {
            delete this.blobQueue[blob.Url];
        },
        enqueueErrorBlocks: function (blob) {
            var cp = this.blobQueue[blob.Url];
            if (cp) {
                var bk = cp.errorBlocks.shift();
                if (bk) {
                    this.blockQueue.push(bk);
                }
            }
        },
        enqueueAllErrorBlocks: function () {
            for (var n in this.blobQueue) {
                var cp = this.blobQueue[n];
                this.enQueueErrorBlocks(cp.blob);
            }
        },
        nextBlock: function () {
            for (key in this.blobQueue) {
                var cp = this.blobQueue[key];
                if (cp.pointer < cp.size) {
                    var bk = new block(cp);
                    cp.blocks.push(bk);
                    cp.pointer += bk.size;
                    return bk;
                }
            }
            return this.blockQueue.shift();
        }, upload: function () {
            this.commitAll();
            while (ja.maxThread == 0 || this.threads < ja.maxThread) {
                var block = this.nextBlock();
                if (block != null) {
                    block.upload();
                    this.threads++;
                } else {
                    break;
                }
            }
        }, commit: function (cp) {
            var uri = cp.blob.Url
            , data = []
            , len = cp.blocks.length
            , web = cp.blob.web;
            cp.commiting = true;
            data.push('<?xml version="1.0" encoding="utf-8"?><BlockList>');
            for (var i = 0; i < len; i++) {
                data.push('<Latest>' + cp.blocks[i].id + '</Latest>');
            }
            data.push('</BlockList>');
            web.request(uri, 'PUT', { comp: 'blocklist' }, {
                data: data.join(''),
                headers: { 'Content-Type': ', text/plain;charset=UTF-8' },
                success: function () {
                    if (cp.success) {
                        uploader.dequeueBlob(cp.blob);//remove the blob from the queue
                        cp.success.apply(cp.blob, arguments);
                    }
                }, error: function () {
                    cp.commiting = false;
                    if (cp.error) {
                        cp.error.apply(cp.blob, arguments);
                    }
                }
            }).send();
        }, commitAll: function () {
            for (n in this.pool) {
                var cp = this.pool[n];
                if (cp.loaded == cp.size && !cp.commiting) {
                    this.commit(cp);
                }
            }
        }
    };
    storage.blob = blob;
})(jAzure, jQuery, window);