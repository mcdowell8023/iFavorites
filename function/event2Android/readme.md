# event2Android

> 移动端 touche 事件套 ，按照 安卓 事件指令要求 ，进行 计数，拼接 凑参
> 这个函数是在 公司项目中 需要 点击 移动端 web 上的视频 进行 手机操控的需求 【云手机】
> 这是一个 可能 一般人用不到的 函数

## 使用

vue 为例：

```js
  created() {
    // new 下
    this.event2Android= new Event2Android()
    // 注册 接收事件
    const toucheBack = {
      "getStartTouches": data => {/* do somthing */},
      "getMoveTouches": data => {/* do somthing */},
      "getEndTouches": data => {/* do somthing */},
      "getCancelTouches": data => {/* do somthing */},
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
