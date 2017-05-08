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
                        stack = stack.concat(sucess);
                        p2.then((s) => {
                            stack = stack.concat(s);
                            resolve(stack);
                        }, (e) => {
                            stack = stack.concat(s);
                            resolve(stack);
                        });
                    },
                    (fail) => {
                        stack = stack.concat(fail);
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
                        listener.onEvent(sucess);
                    },
                    (err) => {
                        // console.log(fail);
                        listener.onEvent(err);
                    });
                break;
            case actionEnum.WhenAny:
                [].forEach.call(promiseArr, (item) => {
                    item.then((sucess) => { listener.onEvent(sucess); }, (err) => { listener.onEvent(err); });
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

        _this.onEvent = function (e) {
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

        _this.wait = function (ok, fail) {
            _this.asPromise();
            var listener = new TaskListener(ok, type);
            executables = promiseComposeForRunAction(_this.promiseArr, listener);
        }

        var taskAsPromise = function (t) {
            if (typeof t === "function") {
                return functionAsPromise(t);
            }

            if (t instanceof TaskManager) {
                return t.asPromise().promiseArr;
            }

            // return emty function
            return functionAsPromise(function (cb) { cb("empty!");});
        }

        _this.asPromise = function () {
            _this.promiseArr = [];
            if (task instanceof Array) {          
                [].forEach.call(task, (item) => {
                    _this.promiseArr = _this.promiseArr.concat(taskAsPromise(item));
                });
            } else {
                _this.promiseArr = _this.promiseArr.concat(taskAsPromise(task));
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
        'run': run,
        'whenAny': whenAny,
        'whenAll': whenAll
    }

})(window)