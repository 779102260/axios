'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 * 构建一个axios实例类
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  // 1. 实例
  /**
   * {request: fn, get: fn， post: fn}
   * 
   * useage: obj.request() / obj.post()
   */
  var context = new Axios(defaultConfig);
  // 2. 使用简化
  // instance 就是axios实例的request方法
  // var instance = funciton(...argus) { return context.request(...argus)}
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  // request 添加静态方法： Axios.prototype 上的方法（方法内this指向实例）
  /**
   * request()
   * { // 静态属性
   *  get: fn()
   * }
   * 
   * useage: request() / request.post()
   * 
   */
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  // 将 实例属性 复制到 instance 构造器
  /**
   * request.bind()
   * {
   *  get: fn(),
   *  defaults, // 静态方法
   *  interceptors
   * }
   */
  utils.extend(instance, context);

  return instance;
}

// Create the default instance to be exported

// 导出的axios（其实是实例的request方法+post等静态方法）
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
// 为了暴露Axios对象，这样可以重写，之后再通过create创建的实例
axios.Axios = Axios;

// Factory for creating new instances
// 创建一个新的axios
// **??? 此方法创建的新axios 没有Cancel / all / spread 等方法???
axios.create = function create(instanceConfig) {
  return createInstance(mergeConfig(axios.defaults, instanceConfig));
};

// Expose Cancel & CancelToken
// 取消请求
/**
 * 逻辑：
 * 
 * - 用户配置 cancelToken ，值需要手动调用由CancelToken.source()产生：
 * {
    token: token, // {reason（已取消的原因），promise（相当于监听事件，待改变状态的promise，调用cancel可以置为resolve，xhr用此方法调用abort方法取消请求）}
    cancel: cancel // 调用此方法取消请求
   }
 * 
 * - xhr 检测是否配置 cancelToken，有则通过cancelToken.token.promise监听用户是否取消请求
 * 
 * - 用户取消请求
 * 调用 cancelToken.cancel(cacel reason) ，将 reason 填写到 cancelToken.token.reason，然后改变promise状态，触发2步骤的监听
 * 
 * - 另外在分发请求时，检测用户是否已经取消请求，如果已经取消请求，则会抛出异常{reason, __CANCEL__: true}，中断后续操作
 * 
 * - 在axios.catch可以捕获取消异常，通过axios.isCancel()可以判断（__CANCEL__）出是否时取消抛出的异常
 */
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
