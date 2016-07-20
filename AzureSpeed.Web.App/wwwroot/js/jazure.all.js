/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
var CryptoJS=CryptoJS||function(h,r){var k={},l=k.lib={},n=function(){},f=l.Base={extend:function(a){n.prototype=this;var b=new n;a&&b.mixIn(a);b.hasOwnProperty("init")||(b.init=function(){b.$super.init.apply(this,arguments)});b.init.prototype=b;b.$super=this;return b},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var b in a)a.hasOwnProperty(b)&&(this[b]=a[b]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
j=l.WordArray=f.extend({init:function(a,b){a=this.words=a||[];this.sigBytes=b!=r?b:4*a.length},toString:function(a){return(a||s).stringify(this)},concat:function(a){var b=this.words,d=a.words,c=this.sigBytes;a=a.sigBytes;this.clamp();if(c%4)for(var e=0;e<a;e++)b[c+e>>>2]|=(d[e>>>2]>>>24-8*(e%4)&255)<<24-8*((c+e)%4);else if(65535<d.length)for(e=0;e<a;e+=4)b[c+e>>>2]=d[e>>>2];else b.push.apply(b,d);this.sigBytes+=a;return this},clamp:function(){var a=this.words,b=this.sigBytes;a[b>>>2]&=4294967295<<
32-8*(b%4);a.length=h.ceil(b/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var b=[],d=0;d<a;d+=4)b.push(4294967296*h.random()|0);return new j.init(b,a)}}),m=k.enc={},s=m.Hex={stringify:function(a){var b=a.words;a=a.sigBytes;for(var d=[],c=0;c<a;c++){var e=b[c>>>2]>>>24-8*(c%4)&255;d.push((e>>>4).toString(16));d.push((e&15).toString(16))}return d.join("")},parse:function(a){for(var b=a.length,d=[],c=0;c<b;c+=2)d[c>>>3]|=parseInt(a.substr(c,
2),16)<<24-4*(c%8);return new j.init(d,b/2)}},p=m.Latin1={stringify:function(a){var b=a.words;a=a.sigBytes;for(var d=[],c=0;c<a;c++)d.push(String.fromCharCode(b[c>>>2]>>>24-8*(c%4)&255));return d.join("")},parse:function(a){for(var b=a.length,d=[],c=0;c<b;c++)d[c>>>2]|=(a.charCodeAt(c)&255)<<24-8*(c%4);return new j.init(d,b)}},t=m.Utf8={stringify:function(a){try{return decodeURIComponent(escape(p.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return p.parse(unescape(encodeURIComponent(a)))}},
q=l.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new j.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=t.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var b=this._data,d=b.words,c=b.sigBytes,e=this.blockSize,f=c/(4*e),f=a?h.ceil(f):h.max((f|0)-this._minBufferSize,0);a=f*e;c=h.min(4*a,c);if(a){for(var g=0;g<a;g+=e)this._doProcessBlock(d,g);g=d.splice(0,a);b.sigBytes-=c}return new j.init(g,c)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});l.Hasher=q.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){q.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(b,d){return(new a.init(d)).finalize(b)}},_createHmacHelper:function(a){return function(b,d){return(new u.HMAC.init(a,
d)).finalize(b)}}});var u=k.algo={};return k}(Math);

//base64-min
(function(){var h=CryptoJS,j=h.lib.WordArray;h.enc.Base64={stringify:function(b){var e=b.words,f=b.sigBytes,c=this._map;b.clamp();b=[];for(var a=0;a<f;a+=3)for(var d=(e[a>>>2]>>>24-8*(a%4)&255)<<16|(e[a+1>>>2]>>>24-8*((a+1)%4)&255)<<8|e[a+2>>>2]>>>24-8*((a+2)%4)&255,g=0;4>g&&a+0.75*g<f;g++)b.push(c.charAt(d>>>6*(3-g)&63));if(e=c.charAt(64))for(;b.length%4;)b.push(e);return b.join("")},parse:function(b){var e=b.length,f=this._map,c=f.charAt(64);c&&(c=b.indexOf(c),-1!=c&&(e=c));for(var c=[],a=0,d=0;d<
e;d++)if(d%4){var g=f.indexOf(b.charAt(d-1))<<2*(d%4),h=f.indexOf(b.charAt(d))>>>6-2*(d%4);c[a>>>2]|=(g|h)<<24-8*(a%4);a++}return j.create(c,a)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();

//hmac-sha256-min
var CryptoJS=CryptoJS||function(h,s){var f={},g=f.lib={},q=function(){},m=g.Base={extend:function(a){q.prototype=this;var c=new q;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
r=g.WordArray=m.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=s?c:4*a.length},toString:function(a){return(a||k).stringify(this)},concat:function(a){var c=this.words,d=a.words,b=this.sigBytes;a=a.sigBytes;this.clamp();if(b%4)for(var e=0;e<a;e++)c[b+e>>>2]|=(d[e>>>2]>>>24-8*(e%4)&255)<<24-8*((b+e)%4);else if(65535<d.length)for(e=0;e<a;e+=4)c[b+e>>>2]=d[e>>>2];else c.push.apply(c,d);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<
32-8*(c%4);a.length=h.ceil(c/4)},clone:function(){var a=m.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],d=0;d<a;d+=4)c.push(4294967296*h.random()|0);return new r.init(c,a)}}),l=f.enc={},k=l.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var d=[],b=0;b<a;b++){var e=c[b>>>2]>>>24-8*(b%4)&255;d.push((e>>>4).toString(16));d.push((e&15).toString(16))}return d.join("")},parse:function(a){for(var c=a.length,d=[],b=0;b<c;b+=2)d[b>>>3]|=parseInt(a.substr(b,
2),16)<<24-4*(b%8);return new r.init(d,c/2)}},n=l.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var d=[],b=0;b<a;b++)d.push(String.fromCharCode(c[b>>>2]>>>24-8*(b%4)&255));return d.join("")},parse:function(a){for(var c=a.length,d=[],b=0;b<c;b++)d[b>>>2]|=(a.charCodeAt(b)&255)<<24-8*(b%4);return new r.init(d,c)}},j=l.Utf8={stringify:function(a){try{return decodeURIComponent(escape(n.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return n.parse(unescape(encodeURIComponent(a)))}},
u=g.BufferedBlockAlgorithm=m.extend({reset:function(){this._data=new r.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=j.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,d=c.words,b=c.sigBytes,e=this.blockSize,f=b/(4*e),f=a?h.ceil(f):h.max((f|0)-this._minBufferSize,0);a=f*e;b=h.min(4*a,b);if(a){for(var g=0;g<a;g+=e)this._doProcessBlock(d,g);g=d.splice(0,a);c.sigBytes-=b}return new r.init(g,b)},clone:function(){var a=m.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});g.Hasher=u.extend({cfg:m.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){u.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,d){return(new a.init(d)).finalize(c)}},_createHmacHelper:function(a){return function(c,d){return(new t.HMAC.init(a,
d)).finalize(c)}}});var t=f.algo={};return f}(Math);
(function(h){for(var s=CryptoJS,f=s.lib,g=f.WordArray,q=f.Hasher,f=s.algo,m=[],r=[],l=function(a){return 4294967296*(a-(a|0))|0},k=2,n=0;64>n;){var j;a:{j=k;for(var u=h.sqrt(j),t=2;t<=u;t++)if(!(j%t)){j=!1;break a}j=!0}j&&(8>n&&(m[n]=l(h.pow(k,0.5))),r[n]=l(h.pow(k,1/3)),n++);k++}var a=[],f=f.SHA256=q.extend({_doReset:function(){this._hash=new g.init(m.slice(0))},_doProcessBlock:function(c,d){for(var b=this._hash.words,e=b[0],f=b[1],g=b[2],j=b[3],h=b[4],m=b[5],n=b[6],q=b[7],p=0;64>p;p++){if(16>p)a[p]=
c[d+p]|0;else{var k=a[p-15],l=a[p-2];a[p]=((k<<25|k>>>7)^(k<<14|k>>>18)^k>>>3)+a[p-7]+((l<<15|l>>>17)^(l<<13|l>>>19)^l>>>10)+a[p-16]}k=q+((h<<26|h>>>6)^(h<<21|h>>>11)^(h<<7|h>>>25))+(h&m^~h&n)+r[p]+a[p];l=((e<<30|e>>>2)^(e<<19|e>>>13)^(e<<10|e>>>22))+(e&f^e&g^f&g);q=n;n=m;m=h;h=j+k|0;j=g;g=f;f=e;e=k+l|0}b[0]=b[0]+e|0;b[1]=b[1]+f|0;b[2]=b[2]+g|0;b[3]=b[3]+j|0;b[4]=b[4]+h|0;b[5]=b[5]+m|0;b[6]=b[6]+n|0;b[7]=b[7]+q|0},_doFinalize:function(){var a=this._data,d=a.words,b=8*this._nDataBytes,e=8*a.sigBytes;
d[e>>>5]|=128<<24-e%32;d[(e+64>>>9<<4)+14]=h.floor(b/4294967296);d[(e+64>>>9<<4)+15]=b;a.sigBytes=4*d.length;this._process();return this._hash},clone:function(){var a=q.clone.call(this);a._hash=this._hash.clone();return a}});s.SHA256=q._createHelper(f);s.HmacSHA256=q._createHmacHelper(f)})(Math);
(function(){var h=CryptoJS,s=h.enc.Utf8;h.algo.HMAC=h.lib.Base.extend({init:function(f,g){f=this._hasher=new f.init;"string"==typeof g&&(g=s.parse(g));var h=f.blockSize,m=4*h;g.sigBytes>m&&(g=f.finalize(g));g.clamp();for(var r=this._oKey=g.clone(),l=this._iKey=g.clone(),k=r.words,n=l.words,j=0;j<h;j++)k[j]^=1549556828,n[j]^=909522486;r.sigBytes=l.sigBytes=m;this.reset()},reset:function(){var f=this._hasher;f.reset();f.update(this._iKey)},update:function(f){this._hasher.update(f);return this},finalize:function(f){var g=
this._hasher;f=g.finalize(f);g.reset();return g.finalize(this._oKey.clone().concat(f))}})})();

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

(function (jAzure, $, global) {
    var ja = jAzure
        , maxBlockSize = 4096 * 1024;
    //storage
    var storage = {
        newLineChar: '\n',
        x_ms_version: '2013-08-15',
        blockSize: maxBlockSize,
        serviceEndpoint: 'core.windows.net',
        splitUrl: function (url) {
            var regex = new RegExp('(http[s]?://([^.]+)\.[^/]*)/([^?/]*)/?([^?]*)(.*)', 'g');
            var match = regex.exec(url);
            if (!match) {
                throw "invalid blob url.";
            }
            return {
                endpoint: match[1],
                accountName: match[2],
                containerName: match[3],
                blobName: match[4],
                sas: match[5]
            };
        }, joinUrl: function () {
            var reg = new RegExp('([^:])/{2,}', 'g');
            return Array.prototype.slice.call(arguments).join('/').replace(reg, '$1/');
        }
    };

    jAzure.storage = storage;

    //get absolute path from url
    function getAbsolutePath(uri) {
        var reg = new RegExp('http[s]?://[^/]*/([^?]*)');
        var match = reg.exec(uri);
        return match && match[1].length > 0 ? match[1] : '/';
    }
    //get the query strings on url
    function getQueryStrings(uri) {
        var reg = new RegExp('([^&?=]+)=([^=&]*)', 'g'), qs = [];
        var match = reg.exec(uri);
        while (match) {
            qs.push({ name: match[1], value: match[2] });
            match = reg.exec(uri);
        }
        return qs;
    }
    function getCanonicalizedHeaderString(headers) {
        var canonicalizedHeaders = [];
        for (var n in headers) {
            if (n.indexOf('x-ms-') == 0) {
                canonicalizedHeaders.push({
                    name: n.toLowerCase(), value: headers[n].trim(), toString: function () {
                        return this.name + ':' + this.value.trim().replace(/\r\n/g, '');
                    }
                });
            }
        }
        canonicalizedHeaders.sort(function (a, b) {
            return a.name > b.name ? 1 : -1;
        });
        return canonicalizedHeaders.join(storage.newLineChar);
    }
    function getCanonicalizedResourceString(uri, accountName, isSharedKeyLiteOrTableService) {
        var resources = ['/', accountName];
        var absolutePath = getAbsolutePath(uri);
        absolutePath = absolutePath.replace(accountName + '-secondary', accountName);
        if (absolutePath) {
            if (absolutePath != '/') {
                resources.push('/');
            }
            resources.push(encodeURI(absolutePath));
        }
        var queryStrings = getQueryStrings(uri);
        if (!isSharedKeyLiteOrTableService) {
            queryStrings.sort(function (a, b) {
                return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
            });
            var len = queryStrings.length;
            for (var i = 0; i < len; i++) {
                var qs = queryStrings[i];
                resources.push(storage.newLineChar);
                resources.push(qs.name.toLowerCase());
                resources.push(':');
                resources.push(encodeURI(qs.value));
            }
        } else {
            var len = queryStrings.length;
            if (len > 0) {
                resources.push(storage.newLineChar);
            }
            for (var i = 0; i < len; i++) {
                if (queryStrings[i].name == 'comp') {
                    resources.push('?comp=');
                    resources.push(queryStrings[i].value);
                }
            }
        }
        return resources.join('');
    }
    function getSharedKeyAuthHeader(request, accountName) {
        var hs = request.isSharedKeyLiteOrTableService ?
             ['Content-MD5', 'Content-Type', 'Date'] :
             ['Content-Encoding', 'Content-Language', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'If-Modified-Since', 'If-Match', 'If-None-Match', 'If-Unmodified-Since', 'Range'];
        var auts = [request.type]
            , len = hs.length;
        for (var idx = 0; idx < len; idx++) {
            var h = request.headers[hs[idx]];
            auts.push(h != undefined ? h : '');
        }
        if (!request.isSharedKeyLiteOrTableService && request.type == 'PUT' || request.type == 'DELETE' || request.type == 'HEAD') {
            auts[3] = request.data ? request.data.length : 0;
        }
        auts.push(getCanonicalizedHeaderString(request.headers));
        auts.push(getCanonicalizedResourceString(request.url, accountName, request.isSharedKeyLiteOrTableService));
        return auts;
    }
    var rnoContent = /^(?:GET|HEAD)$/, rquery = /\?/;
    function cacheUrl(request) {
        var hasContent = !rnoContent.test(request.type), cacheURL = request.url;
        if (!hasContent && request.data) {
            cacheURL += (rquery.test(cacheURL) ? "&" : "?") + request.data;
        }
        return cacheURL;
    }
    function canonicalizeRequestHeaders(request) {
        request.headers = request.headers || {};
        var curl = cacheUrl(request);
        if (request.ifModified) {
            if ($.lastModified[curl]) {
                request.headers["If-Modified-Since"] = $.lastModified[curl];
            }
            if ($.etag[curl]) {
                request.headers['If-None-Match'] = $.etag[curl];
            }
        }
        request.headers['x-ms-version'] = storage.x_ms_version;
        request.headers['x-ms-date'] = new Date().toGMTString();
        if (request.headers['Content-Type']) {
            request.contentType = request.headers['Content-Type'];
        }
    }
    function preSetUrl(request) {
        var url = request.url;
        if (request.params) {
            var p = [];
            for (var n in request.params) {
                p.push(n + '=' + request.params[n]);
            }
            if (url.indexOf('?') > 0) {
                url += '&' + p.join('&');
            } else {
                url += '?' + p.join('&');
            }
            request.url = url;
        }
    }

    function toUTCTime(time) {
        return new Date(time.getUTCFullYear(),
            time.getUTCMonth(),
            time.getUTCDate(),
            time.getUTCHours(),
            time.getUTCMinutes(),
            time.getUTCSeconds());
    }
    function pad(number) {
        var r = String(number);
        if (r.length === 1) {
            r = '0' + r;
        }
        return r;
    }
    function toISOString(time) {
        return time.getUTCFullYear()
            + '-' + pad(time.getUTCMonth() + 1)
            + '-' + pad(time.getUTCDate())
            + 'T' + pad(time.getUTCHours())
            + ':' + pad(time.getUTCMinutes())
            + ':' + pad(time.getUTCSeconds())
            + 'Z';
    }
    var web = function (accountName, sharedKey) {
        return new web.prototype.init(accountName, sharedKey);
    };

    web.prototype = {
        init: function (accountName, sharedKey) {

            var _auth = accountName && sharedKey
                ? { accountName: accountName, sharedKey: sharedKey }
                : null;
            this.sendRequest = function (request) {
                preSetUrl(request);
                request.ifModified = true;
                canonicalizeRequestHeaders(request);
                if (_auth) {
                    var auts = getSharedKeyAuthHeader(request, _auth.accountName),
                        signature = this.compute256(auts),
                        authorization = (request.isSharedKeyLiteOrTableService ? 'SharedKeyLite' : 'SharedKey') + ' ' + accountName + ':' + signature;
                    request.headers['Authorization'] = authorization;
                }
                ja.ajax(request);
            };
            this.compute256 = function (auts) {
                var message = CryptoJS.enc.Utf8.parse(auts.join(storage.newLineChar)),
                    key = CryptoJS.enc.Base64.parse(sharedKey),
                    hash = CryptoJS.HmacSHA256(message, key),
                    signature = hash.toString(CryptoJS.enc.Base64);
                return signature;
            };
        }, request: function (url, verb, params, options) {
            return new request(this, url, verb, params, options);
        }, getSas: function (options) {
            var op = {
                permission: '',
                startTime: '',
                endTime: '',
                resourceName: '',
                policyIdentifier: '',
                storageVersion: storage.x_ms_version,
                cacheControl: '',
                contentDisposition: '',
                contentEncoding: '',
                contentLanguage: '',
                contentType: ''
            };
            var strs = [];
            for (var n in op) {
                if (options[n]) {
                    var v = options[n];
                    if (n == 'startTime' || n == 'endTime') {
                        if (!(options[n] instanceof Date)) {
                            v = new Date(options[n]);
                        }
                        v = toISOString(v);
                    }
                    strs.push(v);
                    op[n] = v;
                } else {
                    strs.push(op[n]);
                }
            }
            op.signature = this.compute256(strs);
            op.resourceType = options.resourceType;
            var qms = {
                'sv': 'storageVersion',
                'sr': 'resourceType',
                'si': 'policyIdentifier',
                'sk': 'accountKeyName',
                'sig': 'signature',
                'st': 'startTime',
                'se': 'endTime',
                'sp': 'permission',
                'rscc': 'cacheControl',
                'rsct': 'contentType',
                'rsce': 'contentEncoding',
                'rscl': 'contentLanguage',
                'rscd': 'contentDisposition'
            };
            strs.length = 0;
            for (var n in qms) {
                var k = qms[n];
                if (op[k]) {
                    var v = op[k];
                    strs.push(n + '=' + encodeURIComponent(op[k]));
                }
            }
            return '?' + strs.join('&');
        }
    };
    web.prototype.init.prototype = web.prototype;

    function request(web, url, verb, params, options) {
        if (options) {
            $.extend(this, options);
        }
        this.web = web;
        this.type = verb;
        this.url = url;
        this.params = params;
    }
    request.prototype = {
        send: function (success, error) {
            if (success) {
                this.success = success;
            }
            if (error) {
                this.error = error;
            }
            this.web.sendRequest(this);
        }
    };
    jAzure.storage.web = web;
})(jAzure, jQuery, window);


(function (jAzure, $, global) {
    var ja = jAzure, storage = ja.storage, web = ja.storage.web;
    var formatUrl = function (type, accountName, serviceEndpoint) {
        return ja.protocol + '://' + accountName + '.' + type + '.' + (serviceEndpoint || storage.serviceEndpoint) + '/';
    }; //account
    var account = function (accountName, sharedKey, serviceEndpoint) {
        return new account.prototype.init(accountName, sharedKey, serviceEndpoint);
    };
    account.prototype.init = function (accountName, sharedKey, serviceEndpoint) {
        ja.defineReadonlyProperties(this, {
            Name: accountName,
            BlobUrl: formatUrl('blob', accountName, serviceEndpoint),
            TableUrl: formatUrl('table', accountName, serviceEndpoint),
            QueueUrl: formatUrl('queue', accountName, serviceEndpoint),
            web: web(accountName, sharedKey)
        });
        return this;
    };
    account.prototype.init.prototype = account.prototype;
    $.extend(account.prototype, {
        getBlobServiceProperties: function (success, error) {
            this.web.request(
                this.BlobUrl, 'GET',
                { restype: 'service', comp: 'properties' }
            ).send(success, error);
        },
        setBlobServiceProperties: function (properties, success, error) {
            var data = $.json2xml({ StorageServiceProperties: properties });
            this.web.request(
                this.BlobUrl,
                'PUT',
                { restype: 'service', comp: 'properties' },
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                    data: data,
                    success: success,
                    error: error
                }
            ).send();
        },
        getBlobServiceStats: function (success, error) {
            this.web.request(
               this.BlobUrl,
               'GET',
               { restype: 'service', comp: 'stats' }
            ).send(success, error);
        }
    });
    ja.storage.account = account;
})(jAzure, jQuery, window);
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