(function(win) {
    var Expandables = function (lamdaArr, index, logs) {
        var _this = this;
        _this.lamdaArr = lamdaArr;
        _this.index = index;
        _this.logs = logs;
        _this.getCurrentPromise = function() {
            return lamdaArr[_this.index]
        }
    }
    
    Promise.fromLamda = function(func) {
        //var _this = this;  
        var promises = [].reduce.call([].concat(func), (acc, cur) =>
        {
            var outs = [];
            return acc.then(x => {
                outs = outs.concat(x);
                return Promise.resolve(cur).then(y => {
                    if (y instanceof Expandables) {
                        outs = outs.concat(y.lamdaArr);
                    } else {
                        outs = outs.concat(y);
                    }
                    return outs;
                });
            })
        }, Promise.resolve([]));

        return promises.then(arr => {
            return new Expandables(arr, 0, []);
        });
    }

    Promise.prototype.runAsync = function () {
        var _this = this;
        return _this.then(x => {
            if (x instanceof Expandables) {
                var promiseArr = [].map.call(x.lamdaArr, (item) => {
                    return lamdaAsPromise(item);
                });
                return Promise.all(promiseArr);
            } else {
                return Promise.reject("error");
            }
        });
    }

    Promise.prototype.run = function() {
        var _this = this;
        return _this.then(x => {
            if (x instanceof Expandables) {
                //console.log(x);
                var currentIndex = x.index;
                if (x.lamdaArr.length == currentIndex) {
                    return Promise.resolve(x.logs);
                }          
                try {
                    var promise = lamdaAsPromise(x.getCurrentPromise());
                    return promise.then(sucess => {
                        x.index = currentIndex + 1;
                        x.logs = x.logs.concat(sucess);
                        return Promise.resolve(x).run();
                    }, fail => {
                        x.index = currentIndex;
                        x.logs = x.logs.concat(sucess);
                        return Promise.resolve(x);
                    });
                } catch (e)
                {
                    return Promise.reject(e);
                } 
                
            } else {
                return Promise.reject("error");
            }
        });
    }

    function lamdaAsPromise(lamda) {
        return new Promise((resolve, reject) => {
            try {
                if (typeof lamda === "function") {
                    lamda(function(ok) {
                        resolve(ok);
                    });
                }
            } catch (err) {
                // fail();
                reject(err);
            }
        }); 
    }

})(window)