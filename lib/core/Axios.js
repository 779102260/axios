'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');

/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  // 拦截器
  // 如何拦截的???????
  this.interceptors = {
    request: new InterceptorManager(), // 请求拦截器
    response: new InterceptorManager() // 响应拦截器
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  // if (config.method) {
  //   config.method = config.method.toLowerCase();
  // } else if (this.defaults.method) {
  //   config.method = this.defaults.method.toLowerCase();
  // } else {
  //   config.method = 'get';
  // }
  // 更简洁
  config.method = (config.method || this.defaults.method || 'get').toLowerCase();

  // Hook up interceptors middleware
  // 待执行队列，每2个一对，表示成功和失败回调
  // 队列的初始操作是方法发送请求
  var chain = [dispatchRequest, undefined];
  // 使用 promise 来调用整个队列
  var promise = Promise.resolve(config);

  // 取出所有请求拦截器，加入执行队列前方（先执行请求拦截器，在发起请求）
  // 可以看出后添加的拦截器将先执行（不太好吧....）
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  // 取出所有响应拦截器，加入执行队列后方（等请求后再执行响应拦截器）
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  // 执行队列
  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;
