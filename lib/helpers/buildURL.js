'use strict';

var utils = require('./../utils');

// 将值按uri要求进行编码
function encode(val) {
  return encodeURIComponent(val). // 除此以外都进行编码：字母 数字 ( ) . ! ~ * ' - _（主要针对参数进行编码）
    replace(/%40/gi, '@'). // 再增加这些不编码
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * 将查询参数格式化后拼接在url后，返回完整的url
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  // 格式化params为字符串
  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  // 判断参数是不是 URLSearchParams（用于解析查询参数）
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString(); // toString方法转换为字符串 'foo=1&bar=2&foo=4'
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      // Date 转 字符串
      // Object 转 字符串
      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  // url拼接上查询参数
  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};
