'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  // >>> step1 如果请求已取消，抛出异常，后续代码中断
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  // >>> step2 发送前用户修改数据
  // transformData:[fn(data, headers)] 发送前使用fn修改发送数据
  config.data = transformData(
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  // step3 构建header
  // 3.1 合并
  config.headers = utils.merge(
    config.headers.common || {}, // 全局配置(默认配置中有) 优先级1
    config.headers[config.method] || {}, // 针对单个method配置 优先级2
    config.headers || {} // 本次配置 优先级3
  );

  // 3.2 删除method header配置（发送时不需要）
  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );
  // >>> step4 使用适配器发送请求（默认适配器会自动选择xhr或http）
  // 适配器：针对web和node（或其他平台），发送的接口是不一样的
  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    // ** 接受后修改响应数据（尚未抛出给then/catch）
    response.data = transformData(
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData(
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};
