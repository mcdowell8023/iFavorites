/*
 * @Author: mcdowell
 * @Date: 2020-04-14 16:19:12
 * @LastEditors: mcdowell
 * @LastEditTime: 2020-05-19 20:01:29
 */

const { EventEmitter } = require('events')

class event2Android extends EventEmitter {
  constructor(props = {}) {
    super(props)
    this.ongoingTouches = new Array() // 用来保存跟踪正在发送的触摸事件
    this.actionTouches = new Array() // 用来维护 actionIndex
    this.downtime = 0
    this.changeIndex = 0 // 协助存储 actionIndex
  }

  handleStart(event) {
    event.preventDefault()
    const { changedTouches, touches, timeStamp } = event
    // 存储 downtime 时间 只存储第一次
    if (this.downtime === 0) {
      this.downtime = timeStamp
    }

    // 存储 触摸点
    for (let i = 0; i < changedTouches.length; i++) {
      let idx = this.ongoingTouchIndexById(
        changedTouches[i].identifier,
        touches
      )
      this.changeIndex = changedTouches[i].identifier
      if (idx > -1) {
        this.ongoingTouches.splice(idx, 0, this.copyTouch(changedTouches[i]))
        this.actionTouches.splice(idx, 0, this.copyTouch(changedTouches[i]))
      } else {
        this.ongoingTouches.push(this.copyTouch(changedTouches[i]))
        this.actionTouches.push(this.copyTouch(changedTouches[i]))
      }
    }
    const data = this.getEventData2Android(event, 'touches')
    this.emit('getStartTouches', data)
  }
  handleMove(event) {
    event.preventDefault()
    let touches = event.changedTouches
    for (let i = 0; i < touches.length; i++) {
      let idx = this.ongoingTouchIndexById(touches[i].identifier)
      // 移动时候
      this.changeIndex = 0
      if (idx >= 0) {
        this.ongoingTouches.splice(idx, 1, this.copyTouch(touches[i])) // 替换对象数据
        this.actionTouches.splice(idx, 1, this.copyTouch(touches[i]))
      }
    }
    const data = this.getEventData2Android(event, 'touches')
    this.emit('getMoveTouches', data)
  }

  handleEnd(event) {
    event.preventDefault()
    let touches = event.changedTouches
    const data = this.getEventData2Android(event)

    for (let i = 0; i < touches.length; i++) {
      let idx = this.ongoingTouchIndexById(
        touches[i].identifier,
        this.actionTouches
      )
      if (idx >= 0) {
        this.actionTouches.splice(idx, 1)
      }
    }
    // 必须在此处返回
    this.emit('getEndTouches', data)

    for (let i = 0; i < touches.length; i++) {
      let idx = this.ongoingTouchIndexById(touches[i].identifier)
      if (idx >= 0) {
        this.ongoingTouches.splice(idx, 1) // 清除数组
      }
    }
    // 维护 downtime
    if (this.downtime !== 0 && this.ongoingTouches.length === 0) {
      this.downtime = 0
    }
  }

  handleCancel(event) {
    event.preventDefault()
    let touches = event.changedTouches
    const data = this.getEventData2Android(event)
    for (let i = 0; i < touches.length; i++) {
      this.actionTouches.splice(i, 1)
    }
    // 必须在此处返回
    this.emit('getCancelTouches', data)
    for (let i = 0; i < touches.length; i++) {
      this.ongoingTouches.splice(i, 1) // remove it; we're done
    }
    if (this.downtime !== 0 && this.ongoingTouches.length === 0) {
      this.downtime = 0
    }
  }

  //拷贝一个触摸对象
  copyTouch(touch) {
    return {
      identifier: touch.identifier,
      pageX: touch.pageX,
      pageY: touch.pageY,
    }
  }

  //找出正在进行的触摸
  ongoingTouchIndexById(idToFind, arr = this.ongoingTouches) {
    for (let i = 0; i < arr.length; i++) {
      let id = arr[i].identifier
      if (id == idToFind) {
        return i
      }
    }
    return -1 // not found
  }
  // 拼接处理值
  getEventData2Android(event, name) {
    const { timeStamp, type, changedTouches } = event
    const touchesData =
      type === 'touchend'
        ? this.ongoingTouches
        : event[name || 'changedTouches']
    // 触控点数量
    const pointerCount = touchesData.length
    // action 0:按下，1:松开，2:滑动     5：多点按下，6：多点松开
    const actionJson = {
      touchstart: pointerCount > 1 ? 5 : 0,
      touchend: this.ongoingTouches.length > 1 ? 6 : 1,
      touchmove: 2,
      touchcancel: 3,
    }
    const action = actionJson[type]

    //[{"id":"123","tooltype":"0"}],
    const properties = []
    // 触摸点 [{"pressure":"1","x":"0","y":"0","size":"1"}]
    const croods = []
    for (let i = 0; i < touchesData.length; i++) {
      let item = touchesData[i]
      properties.push({
        id: item.identifier,
        tooltype: '1',
      })
      croods.push({
        x: item.pageX.toFixed(2),
        y: item.pageY.toFixed(2),
        pressure: '1', // 按压力度 默认1
        size: '1', // 尺寸 默认1
      })
    }

    return {
      action,
      actionIndex:
        // (action & this.ACTION_POINTER_INDEX_MASK) >>
        // this.ACTION_POINTER_INDEX_SHIFT,
        type === 'touchmove'
          ? 0
          : this.ongoingTouchIndexById(
              changedTouches[0].identifier,
              this.actionTouches
            ),
      // type === 'touchend' ? changedTouches[0].identifier : this.changeIndex,
      downtime: Math.round(this.downtime),
      eventtime: Math.round(timeStamp),
      metastate: 0,
      pointerCount,
      properties,
      croods,
    }
  }
}
export default event2Android
