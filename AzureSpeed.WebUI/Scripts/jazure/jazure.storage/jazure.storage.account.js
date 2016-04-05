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