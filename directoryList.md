|-- dist
|-- examples // demos
|-- lib // 源码
|   |-- axios.js // 入口
|   |-- defaults.js // axios 默认配置
|   |-- utils.js // 辅助函数
|   |-- adapters // 适配器（抹平层）
|   |   |-- http.js // 浏览器
|   |   |-- xhr.js // node
|   |-- cancel // 取消机制
|   |   |-- Cancel.js
|   |   |-- CancelToken.js
|   |   |-- isCancel.js
|   |-- core // 核心 Axios 类
|   |   |-- Axios.js // Axios 类
|   |   |-- buildFullPath.js
|   |   |-- createError.js
|   |   |-- dispatchRequest.js // 请求发送
|   |   |-- enhanceError.js
|   |   |-- InterceptorManager.js // 拦截器类
|   |   |-- mergeConfig.js
|   |   |-- settle.js
|   |   |-- transformData.js
|   |-- helpers // 辅助工具
|       |-- bind.js
|       |-- buildURL.js
|       |-- combineURLs.js
|       |-- cookies.js
|       |-- deprecatedMethod.js
|       |-- isAbsoluteURL.js
|       |-- isURLSameOrigin.js
|       |-- isValidXss.js
|       |-- normalizeHeaderName.js
|       |-- parseHeaders.js
|       |-- spread.js
|-- sandbox // http demo
|   |-- client.html
|   |-- client.js
|   |-- server.js
|-- test // 单元测试
|-- .eslintrc.js
|-- .gitignore
|-- .npmignore
|-- .travis.yml
|-- bower.json
|-- Gruntfile.js // grunt 打包工具
|-- index.d.ts
|-- index.js // 入口
|-- karma.conf.js // 测试工具
|-- package.json
|-- webpack.config.js // webpack 打包工具

使用`grunt`为主要流程工具
- 打包间接调用的`webpack`进行打包
- 测试用的`karma`（外加一些人工测试demo）

源码都在`lib`文件夹里