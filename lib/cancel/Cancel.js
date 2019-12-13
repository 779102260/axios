'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 * 取消操作时，调用这个Cancel方法
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;
