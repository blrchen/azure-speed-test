(function (jQuery, global) {
    var jAzure = function () {
        return new jAzure.fn.init();
    };

    jAzure.prototype = {
        init: function () {
            return this;
        }
    };
    
    $.extend(jAzure, {
        maxThread: 7,
        protocol: 'https',
        ajax: function (options) {
            $.ajax({
                url: options.url,
                type: options.type,
                data: options.data,
                dataType: options.dataType,
                ifModified: true,
                headers: options.headers,
                cache: true,
                processData: false,
                xhr: function () {
                    var _xhr = $.ajaxSettings.xhr();
                    if (_xhr.upload && options.progress) {
                        _xhr.upload.addEventListener('progress', function (ev) {
                            options.progress(ev);
                        }, false);
                    }
                    return _xhr;
                },
                beforeSend: function (xhr) {
                    if (options.before) {
                        options.before(xhr);
                    }
                },
                success: function (data, sta, xhr) {
                    if ($.isXMLDoc(data)) {
                        data = $.xml2json(data);
                    }
                    if (options.convertor) {
                        data = options.convertor(data);
                    }
                    if (options.success) {
                        if (options.object) {
                            options.success.call(options.object, data, sta, xhr);
                        } else {
                            options.success(data, sta, xhr);
                        }
                    }
                },
                error: function (xhr, desc, err) {
                    if (options.error) {
                        if (options.object) {
                            options.error.call(options.object, desc, err);
                        } else {
                            options.error(desc, err);
                        }
                    }
                }
            });
        }, getResponseHeaders: function (xhr, prefix, trimPrefix) {
            var headers = xhr.getAllResponseHeaders(), obj = {}, prefix = prefix || '';
            if (trimPrefix === undefined) {
                trimPrefix = true;
            }
            if (headers) {
                $.each(headers.split('\r\n'), function () {
                    var v = this.valueOf();
                    if (!v || (prefix && v.indexOf(prefix) != 0)) {
                        return;
                    }
                    var h = v.split(':');
                    if (trimPrefix) {
                        obj[h[0].substring(prefix.length)] = h[1].trim();
                    } else {
                        obj[h[0]] = h[1].trim();
                    }
                });
            }
            return obj;
        }, setMaxThread: function (maxThread) {
            if (!isNaN(maxThread) && maxThread >= 0) {
                this.maxThread = parseInt(maxThread);
            }
        }, setBlockSize: function (blockSize) {
            if (!isNaN(blockSize)) {
                var size = parseInt(blockSize);
                this.blockSize = Math.max(1, Math.min(size, maxBlockSize));
            }
        }, defineReadonlyProperties: function (obj, props) {
            for (var n in props) {
                Object.defineProperty(obj, n, {
                    value: props[n],
                    writable: false,
                    configurable: false,
                    enumerable: true
                });
            }
        }
    });

    jAzure.prototype.init.prototype = jAzure.prototype;
    jAzure.fn = jAzure.prototype;


    global.jAzure = jAzure;
    if (!global.ja) {
        global.ja = jAzure;
    }
})(jQuery, window);
