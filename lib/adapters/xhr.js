'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');

module.exports = function xhrAdapter(config) {
  // ** ie11
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    // >>> step1 设置header
    // 1.1 Content-Type FormData类型实体处理
    // 如果data是new FormData(form)构造出来的数据，Content-Type自动被设为"multipart/form-data"
    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    // 新建请求
    var request = new XMLHttpRequest();

    // HTTP basic authentication
    // 1.2 用户信息 Authorization
    // 这里设置Authorization头（值格式为：Authorization: Base64(ascii(username:pwd)) ）
    // 注：authorization用于用户认证，但base64没什么安全性，所以应该使用cookie
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password || '';
      // btoa() 将字符串转为ascii码（base-64）
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    // >>> step2 构建url
    // 2.1 增加前缀
    var fullPath = buildFullPath(config.baseURL, config.url);

    // 2.2 将参数转为字符串放到url ?号后
    // >>> step3 新建请求
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    // >>> step4 设置超时时间
    request.timeout = config.timeout;

    // Listen for ready state
    // >>> step5 监听状态变化
    request.onreadystatechange = function handleLoad() {
      // 5.1 readyState 判断  （4：响应并下载）
      // onreadystatechange会在每次readyState时触发一次
      if (!request || request.readyState !== 4) {
        return;
      }

      // The request errored out and we didn't get a response, this will be
      // handled by onerror instead
      // With one exception: request that using file: protocol, most browsers
      // will return status as 0 even though it's a successful request
      // 5.2 status 判断
      // 例外，file:协议，即便请求成功status也可能是0
      // readyState: http请求进度
      // status：服务器响应的状态码
      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
        return;
      }

      // Prepare the response
      // 5.3 获取响应头
      // getAllResponseHeaders 用于获取所有响应头
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      // 5.4 获取返回响应正文
      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
      // 5.5 构建返回数据
      var response = {
        data: responseData,
        status: request.status, // 状态
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(resolve, reject, response);

      // Clean up request
      request = null;
    };

    // Handle browser request cancellation (as opposed to a manual cancellation)
    // >>> step6 监听取消事件
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      // 可能有2个用处：避免再走 onreadystatechange；释放变量
      request = null;
    };

    // Handle low level network errors
    // >>> step7 监听错误事件
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    // >>> step8 超时事件
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
      // ** 文档里没说明的功能，自定义超时信息
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    // >>> step8 请求头自动携带token
    // 使用步骤：
    // 1. token放在请求头上的，需要后端配合
    // 2. 配置withCredentials: true(携带cookie)
    // 3. 配置xsrfCookieName（token在cookie中的key）
    // 配置xsrfCookieName防止跨域攻击，xsrfCookieName值即为token在cookie中key，每次发送请求时，axios会自动从cookie中读取然后加到请求头上
    if (utils.isStandardBrowserEnv()) {
      var cookies = require('./../helpers/cookies');

      // Add xsrf header
      // 配置withCredentials: true & 配置xsrfCookieName & 同源 
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    // >>> step9 设置请求头
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          // 无数据时，去掉content-type头
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    // >>> step10 请求添加withCredentials字段
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    // >>> step11 请求添加responseType字段（指定响应类型）
    if (config.responseType) {
      try {
        request.responseType = config.responseType;
      } catch (e) {
        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
        if (config.responseType !== 'json') {
          throw e;
        }
      }
    }

    // Handle progress if needed
    // >>> step12 添加下载进度事件
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    // >>> step13 添加上传进度事件
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    // >>> step14 允许取消请求
    // 添加回调，如果调用回调，则取消请求
    // 但实际上不一定能成功取消，因为可能请求已经完成，promise状态已经改变
    if (config.cancelToken) {
      // Handle cancellation
      config.cancelToken.promise.then(function onCanceled(cancel) {
        if (!request) {
          return;
        }

        request.abort();
        reject(cancel);
        // Clean up request
        request = null;
      });
    }

    // 标准参数必填
    if (requestData === undefined) {
      requestData = null;
    }

    // Send the request
    // >>> step15 发送请求
    request.send(requestData);
  });
};
