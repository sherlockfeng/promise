/**
* promise core
* @file promise.js
* @author heyunfeng@baidu.com
* 一个符合A+规范且扩展了race，all，catch，finally方法的promise实现
*/

const isFunction = value => typeof value === 'function';
const isObject = value => typeof value === 'object';
const isNode = typeof self === 'undefined'
    && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';
const isArray = value => Array.isArray(value);

let timerFunc;

if (isNode) {
    timerFunc = fun => process.nextTick(fun);
}
else if (typeof setImmediate !== 'undefined') {
    timerFunc = fun => setImmediate(fun);
}
else {
    timerFunc = fun => {
        setTimeout(fun, 0);
    };
}

const run = fun => {
    timerFunc(fun);
};

const PENDING = 'pending';
const FULFILLED = 'fulFilled';
const REJETCED = 'rejected';

// 根据A+规范实现的promise解决过程
const resolvePromise = (promise2, x, resolve, reject) => {
    if (promise2 === x) {
        return reject(new TypeError('循环调用'));
    }

    let then;
    let called;

    if (x != null && (isFunction(x) || isObject(x))) {
        try {
            then = x.then;
            if (isFunction(then)) {
                then.call(x, value => {
                    if (called) {
                        return;
                    }
                    called = true;
                    return resolvePromise(promise2, value, resolve, reject);
                }, reason => {
                    if (called) {
                        return;
                    }
                    called = true;
                    return reject(reason);
                });
            }
            else {
                return resolve(x);
            }
        }
        catch (reason) {
            if (called) {
                return;
            }
            called = true;
            return reject(reason);
        }
    }
    else {
        return resolve(x);
    }
};

class Promise {
    constructor(handle) {
        let self = this;
        self._status = PENDING;
        self._value;
        self._resolveList = [];
        self._rejectedList = [];

        if (!isFunction(handle)) {
            throw new TypeError('handle 不是函数');
        }

        function resolve(value) {
            if (value instanceof Promise) {
                return value.then(resolve, reject);
            }
            run(() => {
                if (self._status === PENDING) {
                    self._value = value;
                    self._status = FULFILLED;
                    self._resolveList.forEach(cb => {
                        cb(value);
                    });
                }
            });
        }

        function reject(value) {
            run(() => {
                if (self._status === PENDING) {
                    self._value = value;
                    self._status = REJETCED;
                    self._rejectedList.forEach(cb => {
                        cb(value);
                    });
                }
            });
        }

        try {
            handle(resolve, reject);
        }
        catch (reason) {
            reject(reason);
        }
    }

    then(onFulfilled, onRejected) {
        let self = this;
        onFulfilled = isFunction(onFulfilled) ? onFulfilled : value => value;
        onRejected = isFunction(onRejected) ? onRejected : reason => {
            throw reason;
        };

        let promise2 = Symbol();
        if (self._status === FULFILLED) {
            promise2 = new Promise((resolve, reject) => {
                run(() => {
                    try {
                        let x = onFulfilled(self._value);
                        resolvePromise(promise2, x, resolve, reject);
                    }
                    catch (reason) {
                        reject(reason);
                    }
                });
            });
        }

        if (self._status === REJETCED) {
            promise2 = new Promise((resolve, reject) => {
                run(() => {
                    try {
                        let x = onRejected(self._value);
                        resolvePromise(promise2, x, resolve, reject);
                    }
                    catch (reason) {
                        reject(reason);
                    }
                });
            });
        }

        if (self._status === PENDING) {
            promise2 = new Promise((resolve, reject) => {
                self._resolveList.push(value => {
                    try {
                        let x = onFulfilled(value);
                        resolvePromise(promise2, x, resolve, reject);
                    }
                    catch (reason) {
                        reject(reason);
                    }
                });
                self._rejectedList.push(value => {
                    try {
                        let x = onRejected(value);
                        resolvePromise(promise2, x, resolve, reject);
                    }
                    catch (reason) {
                        reject(reason);
                    }
                });
            });
        }
        return promise2;
    }

    catch(reject) {
        this.then(undefined, reject);
    }

    finally(cb) {
        return this.then(
            value => Promise.resolve(cb()).then(() => value),
            reason => Promise.reject(cb()).then(() => {
                throw reason;
            })
        );
    }

    static resolve(value) {
        let promise2 = Symbol();
        promise2 = new Promise((resolve, reject) => {
            resolvePromise(promise2, value, resolve, reject);
        });
        return promise2;
    }

    static reject(value) {
        return new Promise((resolve, reject) => reject(value));
    }

    static all(list) {
        return new Promise((resolve, reject) => {
            if (!isArray(list)) {
                reject(new TypeError('list 不是数组'));
            }
            const len = list.length;
            if (!len) {
                resolve([]);
            }
            let result = [];
            let count = 0;
            for (let i = 0; i < len; i++) {
                Promise.resolve(list[i]).then(value => {
                    result[i] = value;
                    count++;
                    if (count === len) {
                        return resolve(result);
                    }
                }, reason => {
                    reject(reason);
                });
            }
        });
    }

    static race(list) {
        return new Promise((resolve, reject) => {
            if (!isArray(list)) {
                reject(new TypeError('list 不是数组'));
            }
            const len = list.length;
            if (!len) {
                resolve([]);
            }
            for (let i = 0; i < len; i++) {
                Promise.resolve(list[i]).then(value => {
                    resolve(value);
                }, reason => {
                    reject(reason);
                });
            }
        });
    }
}

module.exports = Promise;
