const { EventEmitter } = require('events')

class event2Android extends EventEmitter {
  constructor(props = {}) {
    super(props)
    // 维护 按下 的触摸点
    this.startTouches = new Array()
    // 维护 抬起 的触摸点
    // this.endTouches = new Array()
    /* 
      根据 安卓特性模拟：
      startTouches 需要在普通数组基础上，使用 null 占位  splice(idx, 1, null)
      endTouches 需要采用 队列 方式 使用 push 
    */
    this.downtime = 0

    // this.startId = 0
  }

  handleStart(event) {
    event.preventDefault()
    const { changedTouches, timeStamp } = event

    // 存储 downtime 时间 只存储第一次
    if (this.downtime === 0) {
      this.downtime = timeStamp
    }

    // 如果数组每一项 都是 null  则进行清空
    // 全都 为 null 代表 一次触摸事件从新开始
    const isAllNull = this.startTouches.every((item) => item === null)
    if (isAllNull) {
      this.startTouches = []
      // this.endTouches = []
    }

    // 存储 触摸点
    for (let i = 0; i < changedTouches.length; i++) {
      // 确定 第一次 点击
      // if (isAllNull) {
      //   this.startId = changedTouches[i].identifier
      // }

      const item = this.copyTouch(changedTouches[i])
      /* endTouches 队列 进行 补位 操作 */
      // 查找 本地 触摸点组 所有 null 的 index： 是否需要补位
      const idxArr = this.getIndexArrisNull(this.startTouches)
      let idx = idxArr.length === 0 ? -1 : idxArr[0]
      if (idx > -1) {
        this.startTouches.splice(idx, 1, item)
        /* endTouches队列 进行 没有null 进行补栈 */
        // this.endTouches.splice(idx, 0, item)
      } else {
        this.startTouches.push(item)
        /* endTouches队列 进行 压栈 */
        // this.endTouches.push(item)
      }
    }

    const data = this.getEventData2Android(event, 'touches')
    this.emit('getStartTouches', data)
  }
  handleMove(event) {
    event.preventDefault()
    let touches = event.changedTouches

    for (let i = 0; i < touches.length; i++) {
      let idx_start = this.touchListIndexById(
        touches[i].identifier,
        this.startTouches
      )
      // let idx_end = this.touchListIndexById(
      //   touches[i].identifier,
      //   this.endTouches
      // )

      const item = this.copyTouch(touches[i])
      // 移动时候 单纯 维护两个队列
      idx_start >= 0 && this.startTouches.splice(idx_start, 1, item) // 替换对象数据
      // idx_end >= 0 && this.endTouches.splice(idx_end, 1, item)
    }

    const data = this.getEventData2Android(event, 'touches')
    this.emit('getMoveTouches', data)
  }
  //松开
  handleEnd(event) {
    event.preventDefault()
    let touches = event.changedTouches

    const data = this.getEventData2Android(event)

    for (let i = 0; i < touches.length; i++) {
      let idx_start = this.touchListIndexById(
        touches[i].identifier,
        this.startTouches
      )
      // let idx_end = this.touchListIndexById(
      //   touches[i].identifier,
      //   this.endTouches
      // )
      idx_start >= 0 && this.startTouches.splice(idx_start, 1, null) // 清除 并站位
      // idx_end >= 0 && this.endTouches.splice(idx_end, 1) // 清除 触摸点
    }
    // 必须在此处返回
    this.emit('getEndTouches', data)

    // 维护 downtime
    const startTouches = this.filterNull(this.startTouches)
    if (this.downtime !== 0 && startTouches.length === 0) {
      this.downtime = 0
    }
  }

  handleCancel(event) {
    event.preventDefault()
    let touches = event.changedTouches
    const data = this.getEventData2Android(event)
    // for (let i = 0; i < touches.length; i++) {
    //   this.endTouches.splice(i, 1)
    // }
    // 必须在此处返回
    this.emit('getCancelTouches', data)
    for (let i = 0; i < touches.length; i++) {
      this.startTouches.splice(i, 1) // remove it; we're done
      // this.endTouches.splice(i, 1)
    }
    if (this.downtime !== 0 && this.startTouches.length === 0) {
      this.downtime = 0
    }
  }

  // 拷贝 触摸点
  copyTouch(touch) {
    return {
      // id: Math.abs(touch.identifier - this.startId),
      identifier: touch.identifier,
      pageX: touch.pageX,
      pageY: touch.pageY,
    }
  }

  // 找出 触摸点
  touchListIndexById(idToFind, arr) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].identifier == idToFind) {
        return i
      }
    }
    return -1 // not found
  }
  filterNull(arr) {
    return arr.filter((item) => item)
  }
  // 获取暂存数组中， 为 null 的 index 数组
  getIndexArrisNull(arr) {
    // if (!(arr instanceof Array)) {
    //   return []
    // }
    const list = []

    for (let i = 0; i < arr.length; i++) {
      let item = arr[i]
      if (!item) {
        list.push(i)
      }
    }
    return list
  }
  // 拼接处理值
  getEventData2Android(event) {
    // name
    const { timeStamp, type, changedTouches } = event
    const endTouches = this.filterNull(this.startTouches)
    // const touchesData =
    //   type === 'touchend' ? endTouches : event[name || 'changedTouches']
    const touchesData = this.startTouches

    // 触控点数量
    const pointerCount = endTouches.length
    // action 0:按下，1:松开，2:滑动     5：多点按下，6：多点松开
    const actionJson = {
      touchstart: pointerCount > 1 ? 5 : 0,
      touchend: endTouches.length > 1 ? 6 : 1,
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
      if (!item) continue
      properties.push({
        id: i,
        // id: item.id, // item.identifier,
        tooltype: '1',
      })
      croods.push({
        x: item.pageX.toFixed(2),
        y: item.pageY.toFixed(2),
        pressure: '1', // 按压力度 默认1
        size: '1', // 尺寸 默认1
      })
    }

    const list = type === 'touchstart' ? this.startTouches : endTouches
    const actionIndex =
      type === 'touchmove' || endTouches.length === 1
        ? 0
        : this.touchListIndexById(changedTouches[0].identifier, list)

    const res = {
      action,
      actionIndex,
      downtime: Math.round(this.downtime),
      eventtime: Math.round(timeStamp),
      metastate: 0,
      pointerCount,
      properties,
      croods,
    }

    return res
  }
}
export default event2Android
