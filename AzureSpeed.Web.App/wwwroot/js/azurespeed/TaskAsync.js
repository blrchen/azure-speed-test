(function (win) {

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

    var TaskManager = function (task) {
        var _this = this;
        _this.promiseArr = null;
        var executables = null;

        _this.Wait = function (ok, fail) {
            _this.AsPromise();
            executables = [].reduce.call(_this.promiseArr, (acc, cur) => {
                return promiseCompose(acc, cur);
            });
            executables.then(
                (sucess) =>
                {
                    //console.log(sucess);
                    ok(sucess);
                },
                (err) =>
                {
                    console.log(fail);
                    fail(err);
                });
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
        var taskManager = new TaskManager(task);
        return taskManager;
    }

    win.TaskAsync= {
        'Run': run
    }

})(window)