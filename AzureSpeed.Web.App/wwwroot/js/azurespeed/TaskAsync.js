(function (win) {

    var actionEnum = {
        Run: "run",
        WhenAll: "whenAll",
        WhenAny: "whenAny"
    }

    // convert anonymous function to promise
    function functionAsPromise(func) {
        return new Promise((resolve, reject) => {
            try {
                func(function (ok) {
                    resolve(ok);
                });

            } catch (err) {
                //fail();
                reject(err);
            }
        });
    }

    // make promoise link to each other as a whole process
    function promiseCompose(p1, p2) {
        return new Promise((resolve, reject) => {
            if (p1 && p2) {
                // stack for track task message
                var stack = [];
                p1.then(
                    (sucess) => {
                        stack.push(sucess);
                        p2.then((s) => {
                            stack.push(s);
                            resolve(stack);
                        }, (e) => {
                            stack.push(e);
                            resolve(stack);
                        });
                    },
                    (fail) => {
                        stack.push(fail);
                        resolve(stack);
                    }
                );
            }
        }); 
    }

    function promiseComposeForRunAction(promiseArr, listener) {
        switch (listener.type) {
            case actionEnum.Run:
            case actionEnum.WhenAll:
                var executes = [].reduce.call(promiseArr, (acc, cur) => {
                    return promiseCompose(acc, cur);
                });
                executes.then(
                    (sucess) => {
                        listener.OnEvent(sucess);
                    },
                    (err) => {
                        // console.log(fail);
                        listener.OnEvent(err);
                    });
                break;
            case actionEnum.WhenAny:
                [].forEach.call(promiseArr, (item) => {
                    item.then((sucess) => { listener.OnEvent(sucess); }, (err) => { listener.OnEvent(err); });
                });
                break;
        }
        
    }

    var TaskListener = function (handler, type) {
        var _this = this;
        _this.type = type;
        _this.callTimes = 0;

        _this.states = [];
        _this.callBack = handler;

        _this.OnEvent = function (e) {
            if (_this.type === actionEnum.WhenAny && _this.callTimes > 0) {
                return;
            } 
            _this.callTimes += 1;
            if (typeof _this.callBack === "function") {
                _this.callBack(e);
            }
            return null;
        }
    }

    var TaskManager = function (task, type) {
        var _this = this;
        _this.promiseArr = null;
        var executables = null;

        _this.Wait = function (ok, fail) {
            _this.AsPromise();
            var listener = new TaskListener(ok, type);
            executables = promiseComposeForRunAction(_this.promiseArr, listener);
        }

        var TaskAsPromise = function (t) {
            if (typeof t === "function") {
                return functionAsPromise(t);
            }

            if (t instanceof TaskManager) {
                return t.AsPromise().promiseArr;
            }

            // return emty function
            return functionAsPromise(function () { });
        }

        _this.AsPromise = function () {
            _this.promiseArr = [];
            if (task instanceof Array) {          
                [].forEach.call(task, (item) => {
                    _this.promiseArr = _this.promiseArr.concat(TaskAsPromise(item));
                });

            } else {
                _this.promiseArr = _this.promiseArr.concat(TaskAsPromise(task));
            }

            return _this;
        }
    }

    var run = function (task) {
        var taskManager = new TaskManager(task, actionEnum.Run);
        return taskManager;
    }

    var whenAll = function (task) {
        var taskManager = new TaskManager(task, actionEnum.WhenAll);
        return taskManager;
    }

    var whenAny = function (task) {
        var taskManager = new TaskManager(task, actionEnum.WhenAny);
        return taskManager;
    }

    win.TaskAsync= {
        'Run': run,
        'WhenAny': whenAny,
        'WhenAll': whenAll
    }

})(window)