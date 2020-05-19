# event2Android

> 移动端 touche 事件组 ，按照 安卓 事件指令要求 ，进行 计数、拼接

- 这个函数是在【云手机广告】项目中的需要: 点击 移动端 web 上的视频画面， 发送安卓事件参数给远端安卓手机，从而 操控安卓手机的需求
- 这是一个 可能 一般人用不到的 函数

## 使用

vue 为例：

```js
  created() {
    // new 下
    this.event2Android= new Event2Android()
    // 注册 接收事件
    const toucheBack = {
      "getStartTouches": data => {conso.log(data)/* do something */},
      "getMoveTouches": data => {/* do something */},
      "getEndTouches": data => {/* do something */},
      "getCancelTouches": data => {/* do something */},
    }
    Object.key(toucheBack).map(name=>{
      this.event2Android.on(name,toucheBack[name]);
    })
  }
  // 增加事件 addEventLister
  mounted() {
    const oCanvas = this.$refs.commonCanvas;
    // 触摸按下
    oCanvas.addEventListener('touchstart', (e) =>this.event2Android.handleStart(e))
    // 触摸移动
    oCanvas.addEventListener('touchmove', (e) =>this.event2Android.handleMove(e))
    // 触摸抬起
    oCanvas.addEventListener('touchend', (e) => this.event2Android.handleEnd(e))
    // 触摸取消
    oCanvas.addEventListener('touchcancel', (e) =>this.event2Android.handleCancel(e))
  },
```
