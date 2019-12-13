'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  // 实例
  var context = new Axios(defaultConfig);
  // instance 是个构造器，内部调用 request.call(context, params)
  // 形成闭包，其实原本是这样的，改后的更为简洁
  // var instance = funciton(...argus) { return context.request(...argus)}
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  // 将 Axios.prototype 上的方法复制到 instance 构造器
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  // 将 实例 复制到 instance 构造器
  // 为啥要复制2次???????????
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported
// 这里得到的是构造器，添加了静态方法：Axios实例的方法属性
// 为什么需要这样????????????直接拿到实例不好吗????????????????????
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
// 为了暴露Axios对象，这样可以重写，之后再通过create创建的实例，这样就定制了
axios.Axios = Axios;

// Factory for creating new instances
// 创建一个新的axios
// 此方法创建的新axios 没有Cancel等方法，好吗??????????为啥这么设计
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
// 取消请求
// 具体干嘛用的??????????怎么用?????????????
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');

// Expose all/spread
// 并发请求，包装在一起
axios.all = function all(promises) {
  return Promise.all(promises);
};
// 此函数，将传入的arr，分解成单个再传给指定函数
axios.spread = require('./helpers/spread');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;
