'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 * CancelToken 用于取消请求
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;
  // 待改变状态的promise
  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;
  // 这里的内部函数才是真正的取消操作
  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 * 如果请求已取消，抛出异常
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 * 创建一个cancel token
 * {
    token: token, // {reason（已取消的原因），promise（相当于监听事件，待改变状态的promise，调用cancel可以置为resolve，xhr用此方法调用abort方法取消请求）}
    cancel: cancel // 调用此方法取消请求
   }
 * 
 */
CancelToken.source = function source() {
  // fn，取消请求，调用此方法改变promise状态
  var cancel;
  // CancelToken实例
  /**
   * {
   *  reason，// 已取消的原因
   *  promise, // 待改变状态的promise，调用cancel可以置为resolve
   * }
   */
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;
