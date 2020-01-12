'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

// 默认配置
var defaults = {
  // 适配器：检测默认适配器
  adapter: getDefaultAdapter(),
  // 发送前修改请求数据
  // 值是个数组，成员是函数，每个函数要求返新的请求数据
  // 默认函数用于处理特殊情况的请求数据 & 设置header
  transformRequest: [function transformRequest(data, headers) {
    // 大小写错误时，自动校正
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');
    // xhr中的涉及的几个数据类型
    // ??????什么用处
    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) || // 用于存储二进制数据
      utils.isBuffer(data) || 
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    // DataView 用于操作ArrayBuffer
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    // 如果是URLSearchParams对象，设置content-type
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    // json
    if (utils.isObject(data)) {
      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
      return JSON.stringify(data);
    }
    return data;
  }],
  // 返回后修改数据
  // 默认函数：尝试将字符串JSON parse
  transformResponse: [function transformResponse(data) {
    /*eslint no-param-reassign:0*/
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) { /* Ignore */ }
    }
    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  // 超时
  timeout: 0,

  // 跨域攻击
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  // 响应数据最大长度（xhr无效，node的http有效）
  maxContentLength: -1,

  // 成功（resolve）的状态码范围
  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  }
};

// 请求头
defaults.headers = {
  common: {
    'Accept': 'application/json, text/plain, */*'
  }
};

// 各种类型请求的独立配置
utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;
