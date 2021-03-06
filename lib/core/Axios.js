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
  // 拦截器，中间层
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
  // 移动参数
  if (typeof config === 'string') {
    config = arguments[1] || {};
    config.url = arguments[0];
  } else {
    config = config || {};
  }

  // 合并配置项
  config = mergeConfig(this.defaults, config);

  // Set config.method
  // Method处理
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
  // 待执行队列
  // 1. 每2个一对，表示成功和失败回调
  // 2. 初始函数 dispatchRequest，用于发送请求，第二个值是undefined，表示如果前面的拦截器reject将不发送请求
  // 3. dispatchRequest 前方的都是 请求拦截 函数
  // 4. dispatchRequest 后方的都是 响应拦截 函数
  var chain = [dispatchRequest, undefined];
  // 使用 promise 来调用整个队列
  var promise = Promise.resolve(config);
  
  // 拦截器插入到队列中
  // 取出所有请求拦截器，加入执行队列前方（先执行请求拦截器，在发起请求）
  // **???? 可以看出后添加的拦截器将先执行（不太好吧....）
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    chain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  // 取出所有响应拦截器，加入执行队列后方（等请求后再执行响应拦截器）
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    chain.push(interceptor.fulfilled, interceptor.rejected);
  });

  // 执行队列
  // 形成串行管道 p.then().then().then()
  while (chain.length) {
    promise = promise.then(chain.shift(), chain.shift());
  }

  return promise;
};

// uri (为什么需要替换掉查询分隔符 ? 号)
Axios.prototype.getUri = function getUri(config) {
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
// 其他快捷方法支持
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(utils.merge(config || {}, {
      method: method,
      url: url
    }));
  };
});

// 其他快捷方法支持
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
