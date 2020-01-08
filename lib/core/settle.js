'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 * http请求，根据状态码和定义配置，决定返回成功还是失败
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  // validateStatus 函数用于自定义成功失败规则
  var validateStatus = response.config.validateStatus;
  if (!validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    // 创建axios error对象
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};
