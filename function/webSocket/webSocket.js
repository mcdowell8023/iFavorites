/*
 * @Author: mcdowell
 * @Date: 2020-05-14 19:46:14
 * @LastEditors: mcdowell
 * @LastEditTime: 2020-05-18 15:50:06
 */
import { stringify } from 'qs'
const { EventEmitter } = require('events')
/**
 * @description: webSocket 封装
 * @param { string } path 接口路径 required default：''
 * @param { string } host 连接地址 default：''
 * @param { object } query 拼接参数 key value
 * @param { boolean } isSync 创建 webSocket 是否 同步 default：false // 同步方式不需要在 connected 回调中 进行操作 不建议 在需要重连机制状态使用
 * @param { object } heartflag 心跳 default：不开启心跳 null ；开启心跳：true || {} || default：{ parmas:'heart', timeout:3000,type:'await'}  parmas 心跳数据string或josn timeout 心跳间隔时间 type===‘await’ send 时候，终端 一次心跳
 * @param { object } reConnect 重连  default：不重连 null 重连： true || {} ||{ timeout:2000 } 间隔 2000ms 进行 重连操作
 * @param { string } binaryType 传输二进制数据的类型 default：'blob' 可选： 'arraybuffer'
 * @param { boolean } log 日志打印 default：false
 * @param { function } callback 回调函数 default：null 同时支持 事件订阅方式
 * ***********************************************
 * @props { object } socket webSocket存储对象
 * @props { number } readyState webSocket当前状态  ### websocket 状态： CONNECTING	0 OPEN	1(此处开始才可以 通信) CLOSING	2 CLOSED	3 ERROR 4
 * @props { function } init webSocket对象 创建函数
 * @props { function } initSync 创建webSocket对象 使用同步方法 返回 Promise ####不建议 在需要重连机制状态使用
 * @props { function } send 发送数据 使用回到 或者 时间订阅 this.on('message', ()=>{})
 * @props { function } close 关闭 webSocket 使用回到 或者 时间订阅
 * @props { function } closeSync 关闭 webSocket 使用同步方法 返回 Promise
 */

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
  HEART_TYPE: 'await',
  // 默认 关闭 函数 下的code 及 断开说明 【code\reason 限制如下】
  // code: 1000 || >3000 < 4999  reason: 这个UTF-8编码的字符串不能超过123个字节。  否则会关闭失败
  CLOSE_CODE: 3100,
  CLOSE_REASON: '客户端主动断开',
}

class webSocket extends EventEmitter {
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
    } = props
    // url: 根据 环境变量设置 并设置 默认值
    const protocol = window.location.protocol == 'http:' ? 'ws://' : 'wss://'
    let URL = host || window.location.hostname
    const NODE_ENV = process.env.NODE_ENV
    if (NODE_ENV !== 'production') {
      URL = host || window.location.host
    }

    this.props = { protocol, url: URL + path, ...props }
    this.socket = null
    // websocket 状态： CONNECTING	0 OPEN	1(此处开始才可以 通信) CLOSING	2 CLOSED	3 ERROR 4
    this.readyState = 0
    // 重连状态  避免不间断的重连操作
    this.reConnectState = 'close'
    // 心跳 定时结果 用于清除
    this.heartTimer = null

    // init
    if (!isSync) {
      this.init(this.props)
    } else {
      // 使用 connected 同步 返回 Promise 确保 接到对象后，就可以 send
      return this.initSync(this.props)
    }
  }

  commonBack = ({ active, data, resolve, reject }) => {
    const { isSync, callback, log = false } = this.props
    // 状态维护
    this.readyState =
      this.socket && this.socket.readyState ? this.socket.readyState : 0
    const res = { active, readyState: this.readyState, data }

    if (isSync && (resolve || reject)) {
      if (active === 'connected') {
        resolve && resolve(this)
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
   **** init start
   */
  // 初始化 创建 socket
  init = ({ protocol, url, query, resolve, reject }) => {
    if (this.socket) {
      this.socket.close()
      delete this.socket
    }
    this.socket = new WebSocket(
      `${protocol}${url}${query ? '?' + stringify(query) : ''}`
    )

    // 设置数据类型 // 'blob'||'arraybuffer'
    if (this.props.binaryType) {
      this.socket.binaryType = this.props.binaryType
    }

    // connected
    this.socket.onopen = (event) => {
      this.commonBack({ active: 'connected', data: event, resolve })
      // 添加心跳
      this.heartbeat()
    }

    // Listen for messages
    this.socket.onmessage = (event) => {
      this.commonBack({ active: 'message', data: event })
      // 添加心跳
      this.heartbeat()
    }

    // Listen for closed
    this.socket.onclose = (event) => this.oncloseCommon(event)

    // Listen for error
    this.socket.onerror = (event) => {
      this.commonBack({ active: 'error', data: event, reject })
      // 断开 重连
      this.reConnectState = 'open'
      this.props.reConnect && this.reConnect(this.props)
    }
    // 接收 事件
    // 观察者 发送
    this.on('send', this.send)
    // 观察者 关闭
    this.on('close', this.close)
    this.on('closeSync', this.closeSync)
  }
  // 同步初始化 返回 Promise
  initSync = ({ protocol, url, query }) => {
    return new Promise((resolve, reject) => {
      this.init({ protocol, url, query, resolve, reject })
    })
  }
  /*
   **** init end
   */

  /*
   **** send start
   */
  // 发送
  send = (data) => {
    if (this.readyState === 1) {
      const sendData =
        typeof data === 'object' ? JSON.stringify(data) : data || ''
      this.socket.send(sendData)
      // 判断 心跳类型 清除心跳
      if (this.props.heartflag) {
        const { type = DEFAULT_VALUE.HEART_TYPE } = this.props.heartflag
        type === 'await' && clearInterval(this.heartTimer)
      }
    } else {
      const errorMessages = `当前状态：${this.readyState} -- 【 websock 状态必须是 [1]:连接成功后，才可以发送信息 】`
      // throw new Error(errorMessages)
      console.error(new Error(errorMessages))
    }
  }
  /*
   **** send start
   */

  /*
   **** close start
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
          this.socket.onclose = (event) => this.oncloseCommon(event, resolve)
        },
      })
    })
  }
  // 关闭监听 公共函数
  oncloseCommon = (data, resolve) => {
    const res = { active: 'disconnected', data }
    this.commonBack(res)
    // 用于 同步 关闭
    resolve && resolve(res)
    // 清除心跳
    clearInterval(this.heartTimer)
  }
  /*
   **** close start
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
      }, timeout)
    }
  }
}
export default webSocket
