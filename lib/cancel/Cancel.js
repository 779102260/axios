'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 * 取消操作时，使用此类产生一个 取消原因 对象
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
