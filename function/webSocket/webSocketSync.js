/*
 * @Author: mcdowell
 * @Date: 2020-05-14 19:46:14
 * @LastEditors: mcdowell
 * @LastEditTime: 2020-10-13 02:34:17
 */
import { stringify } from 'qs'
const { EventEmitter } = require('events')

// 默认值 都暴露在这里
const DEFAULT_VALUE = {
  // 请求地址 默认值  这个值穿入空字符串， 会默认截取 当前地址栏中地址 作为 host [ production 环境：带端口]
  HOST: '',
  // 请求路径默认值
  PATH: '',
  // 默认 不使用 同步方法创建 websocket
  ISSYNC: false,
  // 默认 重连间隔是 2000 ms 一次
  RECONNECT_TIMEOUT: 2000,
  // 默认 心跳 值是字符串 'heart'
  HEART_PARMAS: 'heart',
  // 默认 2000 ms 发送一次心跳
  HEART_TIMEOUT: 2000,
  // 默认 在心跳模式下， 在send 发送 会暂停一次心跳， 发送结束后，会继续 心跳 【 修改其他任意值 默认 将不会采取这种方式 】
  HEART_TYPE: 'always', // 'await', //
  // 默认 关闭 函数 下的code 及 断开说明 【code\reason 限制如下】
  // code: 1000 || >3000 < 4999  reason: 这个UTF-8编码的字符串不能超过123个字节。  否则会关闭失败
  CLOSE_CODE: 3100,
  CLOSE_REASON: '客户端主动断开',
  // 默认不显示日志
  LOG: false,
}
/**
 * @description: webSocket 封装
 * @param { String } path 接口路径 required default：''
 * @param { String } host 连接地址 default：''
 * @param { Object } query 拼接参数 key value
 * @param { Boolean } isSync 创建 webSocket 是否 同步 default：false // 同步方式不需要在 connected 回调中 进行操作 不建议 在需要重连机制状态使用
 * @param { Array } sendSyncKeys 用于配合 sendSync 匹配后台返回数据  default：[]
 * @param { Object } heartflag 心跳 default：不开启心跳 null ；开启心跳：true || {} || default：{ parmas:'heart', timeout:3000,type:'await'}  parmas 心跳数据string或josn timeout 心跳间隔时间 type===‘await’ send 时候，终端 一次心跳
 * @param { Object } reConnect 重连  default：不重连 null 重连： true || {} ||{ timeout:2000 } 间隔 2000ms 进行 重连操作
 * @param { String } binaryType 传输二进制数据的类型 default：'blob' 可选： 'arraybuffer'
 * @param { Boolean } log 日志打印 default：false
 * @param { Function } callback 回调函数 default：null 同时支持 事件订阅方式
 * ***********************************************
 * @props { object } socket webSocket存储对象
 * @props { number } readyState webSocket当前状态  ### websocket 状态： CONNECTING	0 OPEN	1(此处开始才可以 通信) CLOSING	2 CLOSED	3 ERROR 4
 * @props { function } init webSocket对象 创建函数
 * @props { function } initSync 创建webSocket对象 使用同步方法 返回 Promise ####不建议 在需要重连机制状态使用
 * @props { function } send 发送数据 使用回到 或者 时间订阅 this.on('message', ()=>{})
 * @props { function } sendSync 发送数据  接收连个值 ，发送数据 data ，sgin【必传】 标记message 回执 参数 eg:{type: "advertisement",method: "apply"} 【注： sendSyncKeys 也是必传的 】
 * @props { function } close 关闭 webSocket 使用回到 或者 时间订阅
 * @props { function } closeSync 关闭 webSocket 使用同步方法 返回 Promise
 */
class WebSocketSync extends EventEmitter {
  constructor(props = {}) {
    super(props)

    window.WebSocket = window.WebSocket || window.MozWebSocket
    if (!window.WebSocket) {
      // 检测浏览器支持
      console.error('错误: 浏览器不支持websocket')
      return
    }
    const {
      isSync = DEFAULT_VALUE.ISSYNC,
      // 连接地址
      host = DEFAULT_VALUE.HOST,
      path = DEFAULT_VALUE.PATH,
      sendSyncKeys = [],
    } = props
    // url: 根据 环境变量设置 并设置 默认值
    const protocol = window.location.protocol == 'http:' ? 'ws://' : 'wss://'
    let URL = host || window.location.hostname
    const NODE_ENV = process.env.NODE_ENV
    if (NODE_ENV !== 'production') {
      URL = host || window.location.host
    }

    this.props = { protocol, url: URL + path, clearSendSync: true, ...props }
    this.socket = null
    // websocket 状态： CONNECTING	0 OPEN	1(此处开始才可以 通信) CLOSING	2 CLOSED	3 ERROR 4
    this.readyState = 0
    // 重连状态  避免不间断的重连操作
    this.reConnectState = 'close'
    // 心跳 定时结果 用于清除
    this.heartTimer = null
    // send 池
    // 用于 send message 内容匹配
    this.sendPool = {}
    // sendSyncKeys 用于 标示
    this.sendSyncKeys = sendSyncKeys

    // init
    if (!isSync) {
      this.init(this.props)
    } else {
      // 使用 connected 同步 返回 Promise 确保 接到对象后，就可以 send
      return this.initSync(this.props)
    }
  }
  /*
   ** init start
   */
  /**
   * @description: 初始化 创建 webSocket 注册事件
   * @param { String } protocol 协议 ws:// 或者 wss://
   * @param { String } url 地址 + 请求路径
   * @param { Object } query 请求参数
   * @param { Function } resolve 用于 异步 成功返回
   * @param { Function } reject 用于 异步 失败返回
   * @return:
   */
  // 初始化 创建 socket
  init = ({ protocol, url, query, resolve, reject }) => {
    if (this.socket) {
      this.socket.close()
      delete this.socket
    }
    this.socket = new window.WebSocket(
      `${protocol}${url}${query ? '?' + stringify(query) : ''}`
    )

    // 设置数据类型 // 'blob'||'arraybuffer'
    if (this.props.binaryType) {
      this.socket.binaryType = this.props.binaryType
    }

    // connected
    this.socket.onopen = (event) => {
      this.commit({ active: 'connected', data: event, resolve })
      // 添加心跳
      this.heartbeat()
    }

    // Listen for message
    this.messageListen()

    // Listen for closed
    this.socket.onclose = (event) => {
      console.log('disconnected-- 断开连接')
      this.onCommonSync({ name: 'disconnected', data: event })
    }

    // Listen for error
    this.socket.onerror = (event) => {
      console.log('error-- 出错断开')
      this.commit({ active: 'error', data: event, reject })
      // 断开 重连
      this.reConnectState = 'open'
      this.props.reConnect && this.reConnect(this.props)
    }
    // 接收 事件
    // 观察者 发送
    this.on('send', this.send)

    // 观察者 关闭
    this.on('close', this.close)
  }
  /**
   * @description: 同步 创建 webSocket 初始化 返回 Promise
   * @param { String } protocol 协议 ws:// 或者 wss://
   * @param { String } url 地址 + 请求路径
   * @param { Object } query 请求参数
   * @return:
   */
  initSync = ({ protocol, url, query }) => {
    return new Promise((resolve, reject) => {
      this.init({ protocol, url, query, resolve, reject })
    })
  }

  /*
   ** init end
   */

  /**
   * @description: 提交出口 【用于 向 上层 抛出 内容】公共函数 【 callback回调 ，emit 观察者，promise resolve 】
   * @param { String } active 事件名称
   * @param { Object } data 返回的数据
   * @param { Function } resolve 用于 异步 成功返回
   * @param { Function } reject 用于 异步 失败返回
   * @return:
   */
  commit = ({ active, data, resolve, reject, ...props }) => {
    const { isSync, callback, log = DEFAULT_VALUE.LOG } = this.props
    // 状态维护
    this.readyState =
      this.socket && this.socket.readyState ? this.socket.readyState : 0
    const res = { active, readyState: this.readyState, data, ...props }

    if (isSync && (resolve || reject)) {
      if (active === 'connected') {
        resolve && resolve(this)
      }
      if (active === 'message') {
        resolve && resolve(res)
      }
      if (active === 'error') {
        res.readyState = 4
        reject && reject(new Error('WebSocket 连接错误'))
        return false
      }
    }
    // 打印日志
    log && console.log(`socket-${active}`, data)
    // 发送数据
    try {
      // 回调函数
      callback && callback(res)
      // 观察者
      this.emit(active, res)
    } catch (error) {
      console.error(error, '因为websocket 连接错误，导致 分发事件错误')
    }
  }
  /*
   ** send start
   */

  /**
   * @description: send 接收 【 onmessage 事件 注册函数 】
   * @param {type}
   * @return:
   */
  messageListen = () => {
    this.socket.onmessage = (event) => {
      // 格式化数据
      const data =
        event.data && JSON.parse(event.data) ? JSON.parse(event.data) : null
      // 添加心跳
      this.heartbeat()

      // 异步 方式 for sendSync
      if (this.getSendKey.length > 0) {
        const sendKey = this.getSendKey(data)
        const { sign = null, resolve } = this.sendPool[sendKey] || {}
        // 从 sendPool 池子 中 ，找到对应 send ，并使用其 resolve 返回
        const booleanMessage = this.sendSyncKeys
          .map((name) => sign && data && sign[name] == data[name])
          .every((tiem) => tiem)
        if (sign && booleanMessage) {
          this.commit({
            active: 'message',
            data,
            event,
            resolve,
          })
          delete this.sendPool[sendKey]
          return false
        }
      }
      // 默认 回执
      this.commit({ active: 'message', data, event })
    }
  }

  /**
   * @description: 发送消息
   * @param { Object[String] } data 要发送的消息 {} or string
   * @param { Function } reject resolve 用于 异步 成功返回
   * @param { Function } syncBack sendSync 预留 回调函数
   * @return:
   */
  send = (data, reject, syncBack) => {
    if (this.readyState === 1) {
      const sendData =
        typeof data === 'object' ? JSON.stringify(data) : data || ''
      this.socket.send(sendData)
      // 用于 同步写法钩子
      syncBack && syncBack()
      // 判断 心跳类型 清除心跳
      if (this.props.heartflag) {
        const { type = DEFAULT_VALUE.HEART_TYPE } = this.props.heartflag
        type === 'await' && clearInterval(this.heartTimer)
      }
    } else {
      const errorMessage = `当前状态：${this.readyState} -- 【 websock 状态必须是 [1]:连接成功后，才可以发送信息 】`
      // throw new Error(errorMessage)
      console.error(new Error(errorMessage))
      reject && reject(new Error(errorMessage))
    }
  }
  //
  /**
   * @description: 同步方式 send  返回 Promise
   * @param { Object[String] } data 要发送的消息 {} or string
   * @param { object } sign 用于匹配 message 返回消息 reject 进行 异步
   * @return:
   */
  sendSync = (data, sign = null) => {
    // { type: 'advertisement', method: 'apply' }
    if (!sign && { type: 'advertisement', method: 'apply' }) {
      console.error(
        `error： 第二参数 sign 错误。要使用 sendSync 方法，需要用 sign 标记 send 与 onmessage 回执中的值 对应。eg:{ type: 'advertisement', method: 'apply' }`
      )
      return false
    }
    if (this.sendSyncKeys.length === 0) {
      const arrKey = Object.keys(sign)
      console.error(
        `error： sendSyncKeys 不能为空。要使用 sendSync 方法，请在创建 new 时候，传入。预计:[${arrKey.toString()}]`
      )
      return false
    }

    return new Promise((resolve, reject) => {
      this.send(data, reject, () => {
        // 在 sendPool 池子 中 存储 此次 send
        const sendKey = this.getSendKey(sign)
        this.sendPool[sendKey] = {
          sign,
          resolve,
          timeStamp: new Date().getTime(),
        }
      })
    })
  }
  // 用于 获取 sendPool key
  getSendKey = (sign) => {
    const sendKey = this.sendSyncKeys.reduce((count, name) => {
      return count + '_' + sign[name]
    }, '')
    return sendKey
  }
  // sendSync 过期事件 清理
  setSendKeyTimeout = (timeout = 20000) => {
    const timeoutPoolKeys = Object.keys(this.sendPool)
    console.log(timeoutPoolKeys, 'timeoutPoolKeys')
    const now_timeStamp = new Date().getTime()
    timeoutPoolKeys.map((name) => {
      const { sign, timeStamp, resolve } = this.sendPool[name]
      // 超时 大于 timeout 的 都抛出删除
      if (now_timeStamp - timeStamp > timeout) {
        this.commit({
          active: 'message',
          data: new Error(`超过超时${timeout} ms 进行清理抛出,避免长期阻塞`),
          sign,
          resolve,
        })
        delete this.sendPool[name]
      }
    })
  }
  /*
   ** send end
   */

  /*
   ** close start
   */

  // 关闭
  close = ({
    code = DEFAULT_VALUE.CLOSE_CODE,
    reason = DEFAULT_VALUE.CLOSE_REASON,
    syncBack = null,
    reject,
  } = {}) => {
    // code: 1000 || >3000 < 4999  reason: 这个UTF-8编码的字符串不能超过123个字节。  否则会关闭失败
    // defult: code: 3100 reason: "主动断开"
    if (code > 3000 && code < 4999 && reason.length < 123) {
      this.socket.close(code, reason)
      syncBack && syncBack()
    } else {
      const error = new Error('websocket 关闭失败： 关闭参数错误')
      console.error(error)
      reject && reject(error)
    }
  }
  // 同步方式
  closeSync = ({
    code = DEFAULT_VALUE.CLOSE_CODE,
    reason = DEFAULT_VALUE.CLOSE_REASON,
  } = {}) => {
    return new Promise((resolve, reject) => {
      this.close({
        code,
        reason,
        reject,
        syncBack: () => {
          // 用于重写 this.socket.onclose 函数
          this.socket.onclose = (event) =>
            this.onCommonSync({ name: 'disconnected', data: event, resolve })
        },
      })
    })
  }

  // 关闭监听 公共函数
  onCommonSync = ({ name, data, resolve }) => {
    const res = { active: name, data }
    this.commit(res)
    // 用于 同步 关闭
    resolve && resolve(res)
    // 清除心跳
    clearInterval(this.heartTimer)
  }

  /*
   ** close end
   */

  // 断线 重连
  reConnect = ({ protocol, url, query, resolve, reject, reConnect }) => {
    const { timeout = DEFAULT_VALUE.RECONNECT_TIMEOUT } = reConnect
    if (this.reConnectState === 'close') return
    this.reConnectState = 'close'
    //没连接上会一直重连，设置延迟避免请求过多
    setTimeout(() => {
      this.init({ protocol, url, query, resolve, reject })
    }, timeout)
  }
  // 心跳
  heartbeat = () => {
    // 心跳 [ 前提在非断线重连状态下 ]
    if (this.props.heartflag && this.reConnectState === 'close') {
      const {
        parmas = DEFAULT_VALUE.HEART_PARMAS,
        timeout = DEFAULT_VALUE.HEART_TIMEOUT,
      } = this.props.heartflag
      clearInterval(this.heartTimer)
      this.heartTimer = setInterval(() => {
        this.send(parmas)
        // 用于过期清理 超时异步 sendPool 默认20s [此处启用 需要 HEART_TYPE 不为 ‘await’]
        // if (this.props.clearSendSync) {
        //   this.setSendKeyTimeout(this.props.clearSendSync.timeout)
        // }
      }, timeout)
    }
  }
}
export default WebSocketSync
