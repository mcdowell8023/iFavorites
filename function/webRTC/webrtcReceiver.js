/*
 * @Author: mcdowell
 * @Date: 2020-06-04 09:49:06
 * @LastEditors: mcdowell
 * @LastEditTime: 2020-10-13 02:33:32
 */
// 引入 webrtc 兼容垫片

// eslint-disable-next-line no-unused-vars
import adapter from 'webrtc-adapter'
// import { stringify } from 'qs'
const { EventEmitter } = require('events')
import io from 'socket.io-client'

class webrtcReceiver extends EventEmitter {
  constructor(props = {}) {
    super(props)
    this.debugger = false
    this.stream = null // 流
    this.socket = null
    this.pc = null
    this.state = 'init'

    this.pcConfig = {
      iceTransportPolicy: 'relay', //'all',
      iceServers: [
        // {
        //   // urls: 'stun:support.91lanjiang.com:3478',
        //   urls: 'turn:103.219.64.230:3478',
        //   credential: 'lanjiang',
        //   username: 'lanjiang',
        // },
        {
          urls: 'turn:103.219.64.230:3479',
          credential: 'lanjiang',
          username: 'lanjiang',
        },
        // {
        //   urls: 'turn:103.219.64.230:3480',
        //   credential: 'lanjiang',
        //   username: 'lanjiang',
        // },
      ],
    }
  }
  // 暴露 出去的函数，用于 初始化
  static init({
    pcConfig = null,
    socketConfig = null,
    id = null,
    bitrates = 4096,
  }) {
    const clienter = new webrtcReceiver()
    // 创建 PeerConnection
    // clienter.createPeerConnection({ pcConfig })
    // 创建 web sock
    clienter.createSocket(
      socketConfig,
      (pcConfig = pcConfig || clienter.pcConfig),
      bitrates
    )
    // id 存在 执行 接流端播放 功能
    id && clienter.play(id)

    return clienter
  }
  // 修改 最大带宽配置的方式
  setMediaBitrates(sdp, media, bitrate) {
    var lines = sdp.split('\n')
    var line = -1
    for (var i = 0; lines.length; i++) {
      if (lines[i].indexOf('m=' + media) === 0) {
        line = i
        break
      }
    }

    if (line === -1) {
      return sdp
    }

    // console.debug('m line for', media)
    line++
    while (lines[line].indexOf('i=') === 0 || lines[line].indexOf('c=') === 0) {
      line++
    }
    if (lines[line].indexOf('b') === 0) {
      lines[line] = 'b=AS:' + bitrate
      return lines.join('\n')
    }

    //Add a new b line
    var newLines = lines.slice(0, line)
    newLines.push('b=AS:' + bitrate)
    newLines = newLines.concat(lines.slice(line, lines.length))
    return newLines.join('\n')
  }
  // 编辑 SDP
  editSDP(sdp, bitrates = 2048) {
    // SDP设置码率有两种方式:
    // console.log(sdp, '编辑 SDP')
    // 方案一
    // return this.setMediaBitrates(sdp, 'video', 1536)
    const sdpStr = this.setMediaBitrates(sdp, 'video', bitrates) // 2.5M
    // 干掉 横竖屏 信息
    return sdpStr.replace('\na=extmap:3 urn:3gpp:video-orientation', '')
    // 方案二
    // return sdp.replace(
    //   'a=rtcp-fb:96 transport-cc',
    //   `a=rtcp-fb:96 transport-cc x-google-max-bitrate=1408;x-google-min-bitrate=521;x-google-start-bitrate=1024`
    // )
  }

  // 创建 PeerConnection
  createPeerConnection({ pcConfig = null, eventObject = null }) {
    // const RTCPeerConnection =
    //   window.RTCPeerConnection || window.webkitRTCPeerConnection
    this.pc = new RTCPeerConnection({ ...this.pcConfig, ...pcConfig })
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        this.pc.addTrack(track, this.stream)
      })
    }
    const pcEvent = {
      onidentityresult: () => {},
      onidpassertionerror: () => {},
      onidpvalidationerror: () => {},
      // 发生需要会话协商的更改时，将触发此事件。 mdn 上说，可以 在此处 进行offer 创建
      onnegotiationneeded: () => {},
      // onpeeridentity: () => {},
      // 监听 ICE 连接状态
      // 当ICE连接状态更改为"closed"，"failed"，或者 "disconnected"时，
      // 关闭我们的连接端，以便我们准备好重新开始或接受呼叫。
      oniceconnectionstatechange: () => {
        // "checking" 正在相互检查本地和远程候选者对
        // ‘connected’ 已建立连接
        // mdn https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState
        if (this.pc) {
          // console.log(this.pc.iceConnectionState, 'ice 连接状态')
          // 日志记录
          window.collectLog &&
            window.collectLog(`ice 连接状态_${this.pc.iceConnectionState}`)
        }
      },
      // 监听 ICE 信令状态 如果信号状态变为 closed，关闭呼叫。
      // ICE 连接 建立 状态
      onsignalingstatechange: () => {
        if (this.debugger && this.pc) {
          console.log(this.pc.signalingState, 'ice 信令状态')
        }
        // 状态说明
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/signalingState
      },
      // 监听 ICE 收集状态
      onicegatheringstatechange: () => {
        if (this.pc) {
          // console.log(this.pc.iceGatheringState, 'ice 收集状态')
          // 日志记录
          window.collectLog &&
            window.collectLog(`ice 收集状态_${this.pc.iceGatheringState}`)
        }
        // let codecList = null
        // if (this.pc.iceGatheringState === 'complete') {
        //   const receiver = this.pc.getReceivers()

        //   receiver.forEach((receiver) => {
        //     if (receiver.track.kind === 'video') {
        //       const item = receiver.getParameters()
        //       console.log(item, '在这里查看编码器--getParameters')
        //       codecList = item.codecs
        //       return
        //     }
        //   })
        //   console.log(receiver, '在这里查看编码器--all', codecList)
        // }
      },
      // 获取 音视频流 轨道
      // 此处 只是告诉 客户端 就媒体问题 开始进行协商 （仅仅告知客户端搭建流轨道）
      ontrack: (event) => {
        this.debugger && console.log(event, 'event--ontrack--流')
        this.stream = event.streams[0]
        // remoteVideoPlay.srcObject = e.streams[0];
        this.emit('streamsTrack', event)
      },
      onremovestream: (event) => {
        this.emit('onremovestream', { event, stream: this.stream })
      },
      /* 只要本地代理ICE 需要通过信令服务器传递信息给其他对等端时就会触发 */
      onicecandidate: (event) => {
        const candidate = event.candidate
        if (candidate) {
          this.debugger && console.log('find an new candidate', candidate)
          if (this.socket)
            this.socket.emit('message', {
              type: 'candidate',
              label: candidate.sdpMLineIndex,
              id: candidate.sdpMid,
              candidate: candidate.candidate,
            })
        }
      },
      /* 连接状态变化 创建连接结束 在这里触发 */
      onconnectionstatechange: (event) => {
        // 连接状态
        // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState
        const { connectionState = '' } = this.pc
        this.debugger &&
          console.log(connectionState, 'ice 连接状态--onconnectionstatechange')
        switch (connectionState) {
          case 'connected':
            this.emit('connected', { event, stream: this.stream })
            break
          case 'disconnected':
            console.log('pc连接断开')
            break
          case 'failed':
            console.log('pc连接失败', this.state)
            this.emit('failed')
            break
          case 'closed':
            console.log('pc连接关闭')
            break
        }
      },
      ...eventObject,
    }
    // 循环 注册事件
    Object.keys(pcEvent).forEach((eventName) => {
      if (!this.pc) return false
      this.pc[eventName] = (event) => {
        this.debugger && console.log('pc_' + eventName, event)
        pcEvent[eventName] && pcEvent[eventName](event)
      }
    })
  }
  closePeerConnection() {
    if (this.pc) {
      console.log('close peerConnection')
      // 日志记录
      window.collectLog && window.collectLog('close_peerConnection')
      this.pc.close()
      this.pc = null
      this.emit('closed', { type: 'closePeerConnection' })
    }
  }
  // createOffer 发起通话
  async call() {
    if (this.state == 'joined_conn') {
      if (this.pc) {
        const offerOptions = {
          offToReceiveAudio: false,
          offToReceiveVideo: false, //获取视频
        }
        try {
          const desc = await this.pc.createOffer(offerOptions)
          this.debugger && console.log(desc, 'call--create offer')
          await this.pc.setLocalDescription(desc)
          // 发送信令
          if (this.socket) this.socket.emit('message', desc)
        } catch (error) {
          console.log(error)
        }
      }
    }
  }
  // 媒体协商
  swap(data, bitrates) {
    const swapEvent = {
      offer: async (data) => {
        // 日志记录
        window.collectLog && window.collectLog('getoffer')
        this.debugger && console.log(data, 'swap--offer')
        // await this.pc.setRemoteDescription(new RTCSessionDescription(data))
        this.pc.setRemoteDescription(data)
        try {
          const desc = await this.pc.createAnswer()
          desc.sdp = this.editSDP(desc.sdp, bitrates)
          this.debugger && console.log(desc, 'swap--offer--create answer')
          await this.pc.setLocalDescription(desc)
          // 发送信令
          if (this.socket) this.socket.emit('message', desc)
        } catch (error) {
          console.log(error)
        }
      },
      answer: (data) => {
        // 日志记录
        window.collectLog && window.collectLog('sendanswer')
        this.debugger && console.log(data, 'swap--answer')
        this.pc.setRemoteDescription(new RTCSessionDescription(data))
      },
      candidate: (data) => {
        // 将候选者加入到peerConnection中
        const candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate,
        })
        this.debugger && console.log(candidate, 'swap--candidate')
        this.pc.addIceCandidate(candidate)
      },
    }
    swapEvent[data.type] && swapEvent[data.type](data)
  }

  closeLocalMedia() {
    if (this.stream && this.stream.getTracks()) {
      this.stream.getTracks().forEach((track) => {
        track.stop()
      })
    }
    this.stream = null
  }
  // sock io 连接 信令服务
  createSocket(
    { url = '/', options = null, eventObject = null },
    pcConfig,
    bitrates
  ) {
    // let URL = url || window.location.hostname
    // const NODE_ENV = process && process.env && process.env.NODE_ENV
    // if (NODE_ENV !== 'production') {
    //   URL = url || '/'
    // }
    this.socket = io.connect(url, options)
    const socketEvent = {
      // 消息
      message: (data) => {
        // 媒体 协商
        this.swap(data, bitrates)
      },
      // 断开
      disconnect: (data) => {
        this.debugger && console.log('socket disconnect message', data)
        if (!(this.state === 'leaved')) {
          this.closePeerConnection()
          this.closeLocalMedia()
          this.emit('closed', { type: 'disconnect' })
        }
        this.state = 'leaved'
      },
      // 加入
      joined: (data) => {
        const { roomCount } = data
        // 日志记录
        window.collectLog && window.collectLog('joined')
        // 房间人数 大于 1 进行 createPeerConnection
        if (roomCount > 1) {
          this.createPeerConnection({ pcConfig })
          // 日志记录
          window.collectLog && window.collectLog('createPeerConnection')
        }
      },
      // 其他用户加入
      otherJoin: () => {
        // 开始 发起媒体协商
        this.call()
      },
      // 房间已满
      full: (data) => {
        this.state = 'leaved'
        this.debugger &&
          console.log('receive full message, 房间已满', data, this.state)
        this.closePeerConnection()
        this.closeLocalMedia()
        this.emit('closed', { type: 'full' })
      },
      // 自己离开
      leaved: (data) => {
        this.state = 'leaved'
        this.debugger && console.log('receive leaved message, 自己离开', data)
        this.closePeerConnection()
        this.closeLocalMedia()
        this.closeSocket()
        this.emit('closed', { type: 'leaved' })
      },
      // 他人离开
      bye: (data) => {
        this.state = 'joined_unbind'
        this.debugger && console.log('receive bye message, 他人离开', data)
        this.closePeerConnection()
        this.closeLocalMedia()
        this.closeSocket()
        this.emit('closed', { type: 'bye' })
      },
      ...eventObject,
    }

    // 循环 注册事件
    Object.keys(socketEvent).forEach((eventName) => {
      this.socket.on(eventName, (data) => {
        // 存储 状态
        this.state = eventName
        this.debugger && console.log('socket_' + eventName, data)
        socketEvent[eventName] && socketEvent[eventName](data)
        // 暴露 信令事件
        this.emit('socket_' + eventName, data)
      })
    })
  }

  closeSocket() {
    this.socket.disconnect()
  }
  // 直接使用的方法
  play(id) {
    this.socket.emit('join', id)
  }
  close(id) {
    if (this.socket) {
      this.socket.emit('leave', id) //notify server
    }
    this.closePeerConnection()
    this.closeLocalMedia()
  }
}
export default webrtcReceiver
