/*
 * @Author: mcdowell
 * @Date: 2020-05-20 19:16:23
 * @LastEditors: mcdowell
 * @LastEditTime: 2020-05-21 17:19:07
 */
/*
 * @Author: mcdowell
 * @Date: 2019-09-16 20:12:32
 * @LastEditors: mcdowell
 * @LastEditTime: 2020-05-20 17:07:12
 */
/* eslint-disable consistent-return */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */

/**
 * @description: 补0 操作
 * @param { number } val
 * @return: 1 => 01 ; 12 => 12
 */
export function fixedZero(val) {
  if (isNaN(val)) return val
  return val * 1 < 10 ? `0${val}` : val
}

/**
 * @description: 检测是否 是 url 地址
 * @param { string } url
 * @return: true or false
 */
export function isUrl(path) {
  /* eslint no-useless-escape:0 */
  const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+(?::\d+)?|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/
  return reg.test(path)
}
/**
 * @description: 拼接 参数 到 路径  【 需要借助函数转换 searchurl（url键值对）】
 * @param { string } path
 * @param { object } query
 * @return:
 */
export function getQueryPath(path = '', query = {}) {
  // const search = qa.stringify(query) 需要引入qs库
  const search = json2url(query)
  if (search.length) {
    return `${path}?${search}`
  }
  return path
}
/*
 * 关于使用 encodeURIComponent 说明
 ****
 * 比如: 一个用户可能会输入"Thyme &time=again"作为comment变量的一部分。
 * 如果不使用encodeURIComponent对此内容进行转义，服务器得到的将是 `comment=Thyme%20&time=again`。
 * 请注意，"&"符号和"="符号产生了一个新的键值对，
 * 所以服务器得到两个键值对（一个键值对是comment=Thyme，另一个则是time=again），而不是一个键值对。
 * 避免服务器收到不可预知的请求，对任何用户输入的作为URI部分的内容你都需要用 encodeURIComponent 进行转义。
 ****
 *  MDN https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
 */
/**
 * @description: json对象 转换为 url键值对 【 考虑到 请求传参数可能出现问题 使用 encodeURIComponent 部分字符转译处理 】
 * @param { object } josn
 * @return:
 */
export function json2url(josn) {
  try {
    return Object.keys(josn)
      .map((name) => {
        return `${encodeURIComponent(name)}=${encodeURIComponent(josn[name])}`
      })
      .join('&')
  } catch (err) {
    return ''
  }
}
/**
 * @description: url键值对 转换为 json对象
 * @param { string } url 可以包含 ？ # 会自动切除处理，只去取之后的参数
 * @return:
 */
export function url2json(url) {
  try {
    if (!url.includes('&') || !url.includes('=')) {
      return url
    }
    const urlParams = url.match(/\?([^#]+)/)[1]
    const json = {}
    const arr = urlParams.split('&')
    for (let i = 0; i < arr.length; i++) {
      const subArr = arr[i].split('=')
      const key = decodeURIComponent(subArr[0])
      const value = decodeURIComponent(subArr[1])
      json[key] = value
    }
    return json
  } catch (err) {
    return null
  }
}

export const importCDN = (url, name) =>
  new Promise((resolve) => {
    const dom = document.createElement('script')
    dom.src = url
    dom.type = 'text/javascript'
    dom.onload = () => {
      resolve(window[name])
    }
    document.head.appendChild(dom)
  })

// 递归方法
/* return 方式 */
export const recurrence = (data, name, value, children = 'children') => {
  if (!data) {
    return
  }
  for (const iteam of data) {
    if (iteam[name] === value) {
      // eslint-disable-next-line consistent-return
      return iteam
    }
    if (iteam[children]) {
      const valdata = recurrence(iteam[children], name, value)
      if (valdata) {
        // 问题根源在于：return会打断for循环 那么： 找到可以return结束，找不到只是递归调用
        // eslint-disable-next-line consistent-return
        return valdata
      }
    }
  }
}

/* 重命名树结构字段 */
export const renameMenuList = (arr, isHasBtn) => {
  if (!arr || (arr && arr.length === 0)) {
    return []
  }
  return arr
    .map((item) => {
      const { type, id, name, childData } = item
      let result = null
      // 只返回菜单 不返回按钮
      if (isHasBtn || (!isHasBtn && type === 1)) {
        result = {
          title: name,
          id,
          value: id,
          key: id,
          children: childData,
        }
        if (item.childData) {
          const children = renameMenuList(item.childData, isHasBtn)
          result = {
            ...result,
            children,
          }
        }
      }
      return result
    })
    .filter((item) => item)
}

export const getTreeParent = (data2, nodeId2) => {
  let arrRes = []
  if (data2.length === 0) {
    if (nodeId2) {
      arrRes.unshift(data2)
    }
    return arrRes
  }
  const rev = (data, nodeId) => {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < data.length; i++) {
      const node = data[i]
      if (node.value === nodeId) {
        arrRes.unshift(node)
        rev(data2, node.parent_id)
        break
      } else if (node.children) {
        rev(node.children, nodeId)
      }
    }
    return arrRes
  }
  arrRes = rev(data2, nodeId2)
  return arrRes
}

/* 导出下载 */
export const download = (src, name = '') => {
  const $a = document.createElement('a')
  $a.setAttribute('href', src)
  $a.setAttribute('download', name)

  const evObj = document.createEvent('MouseEvents')
  evObj.initMouseEvent(
    'click',
    true,
    true,
    window,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    true,
    false,
    0,
    null
  )
  $a.dispatchEvent(evObj)
}

/* 上传配置 */
/**
 * @description: 文件 上传配置
 * @param { object } action 上传地址
 * @param { object } accept 扩展名 , 分割 小写
 * @param { object } size 大小 KB 大小自行转换
 *
 * @param { function } success 成功回调
 * @param { function } error 失败回调
 *
 * @param { any } opt 配置同 ant Upload
 * @return: opt
 */
export const getUploadProps = (opt) => {
  if (!opt) {
    return null
  }
  return {
    showUploadList: false, // 是否显示 列表
    name: 'file',
    action: '/',
    data: { token: getLocal('token') },
    headers: {
      authorization: 'authorization-text',
    },
    onChange(info) {
      const res = info.file.response
      if (info.file.status === 'done' && res) {
        message[res.status === '200' ? 'success' : 'error'](
          `${info.file.name} : ${res.message || '上传成功'}`
        )
        /* 进行进一步异常处理 */
        const { status } = res
        if (status && status.indexOf('40001') > -1) {
          notification.error({
            message: res.message || '未登录或登录已过期，请重新登录。',
          })
          // 退出到登陆页面
          router.push('/login')
          return false
        }
        // 回调
        if (opt.success) {
          opt.success(info)
        }
      } else if (info.file.status === 'error' && res) {
        message.error(`${info.file.name} : ${res.message || '上传失败'}`)
        // 回调
        if (opt.error) {
          opt.error(info)
        }
      }
    },
    beforeUpload(file) {
      // eslint-disable-next-line no-unused-expressions
      opt.beforeFN && opt.beforeFN(file)
      const index = file.name.lastIndexOf('.')
      const suffix = file.name.substring(index + 1).toLowerCase()
      const fileSize = file.size / 1024 // 换成 KB
      // 文件类型拦截
      if (opt.accept && opt.accept.indexOf(suffix) === -1) {
        message.error(`上传失败 :${file.name} 不是${opt.accept}文件`)
        return false
      }
      // 文件大小
      if (opt.size && fileSize > opt.size) {
        message.error(`上传失败 :${file.name} 大于${opt.size}KB`)
        return false
      }

      return true
    },
    ...opt,
  }
}
// 查找数组 返回 index 没有返回 -1
export const findIndexInArr = (arr, val) => {
  if (!arr) {
    return 'error: arr is null'
  }
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) {
      return i
    }
  }
  return -1
}
// 数组删除
export const removeInArr = (arr, val) => {
  if (!arr) {
    return 'error: arr is null'
  }
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) {
      arr.splice(i, 1)
      break
    }
  }
  return arr
}
// 查找 json数组 index 没有返回 -1
export const findIndexInArrJson = (arr, val, name) => {
  if (!arr) {
    return 'error: arr is null'
  }
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][name] === val) {
      return i
    }
  }
  return -1
}

// json数组 删除
export const removeInArrJson = (arr, val, name) => {
  if (!arr) {
    return 'error: arr is null'
  }
  if (arr[0] && !arr[0][name]) {
    // eslint-disable-next-line prefer-template
    return 'error: arr is request json &&  has "' + name + '"'
  }
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][name] === val) {
      arr.splice(i, 1)
      break
    }
  }
  return arr
}
/**
 * @description: 多维数组 拉平
 * @param { Array } arr
 * @return:
 */
export const flat = (arr) => {
  return arr.reduce((pre, value) => {
    return Array.isArray(value) ? [...pre, ...flat(value)] : [...pre, value]
  }, [])
}
/**
 * @description: 时间控件 配套 结束时间 大于开始时间
 */
const range = (start, end) => {
  const result = []
  for (let i = start; i < end; i++) {
    result.push(i)
  }
  return result
}
// 日期控制
export const disabledDate = (current, type, stateDate) => {
  if (type === 'end' && stateDate) {
    return (
      current &&
      (current > moment().endOf('day') ||
        current < moment(stateDate, 'YYYY-MM-DD HH:mm:ss'))
    )
  }
  // 开始时间控制
  return stateDate
    ? current && current > moment(stateDate, 'YYYY-MM-DD HH:mm:ss')
    : current && current > moment().endOf('day')
}
// 时间控制
export const disabledDateTime = (current, type, stateDate) => {
  // 当前 时间 时 分 秒
  const H = moment().hours()
  const M = moment().minutes()
  const S = moment().seconds()
  // 选中 时 分
  const HCurrent = moment(current).hours()
  const MCurrent = moment(current).minutes()
  // 结束时间： 如果选择了 开始时间 日期 ，时间 必须 大于 开始的 时间
  const isStateDateDay =
    stateDate &&
    moment(current).format('YYYY-MM-DD') ===
      moment(stateDate, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD')
  if (type === 'end' && isStateDateDay) {
    const HStateDate = moment(stateDate).hours()
    const MStateDate = moment(stateDate).minutes()
    const SStateDate = moment(stateDate).seconds()
    // 选中 时 分 与 开始时间 时 分 比较
    return {
      disabledHours: () =>
        range(0, 24).splice(
          0,
          SStateDate + 1 === 60 && MStateDate + 1 === 60
            ? HStateDate + 1
            : HStateDate
        ),
      disabledMinutes: () =>
        HCurrent === HStateDate
          ? range(0, 60).splice(
              0,
              SStateDate + 1 === 60 ? MStateDate + 1 : MStateDate
            )
          : [],
      disabledSeconds: () =>
        HCurrent === HStateDate && MCurrent === MStateDate
          ? range(0, 60).splice(0, SStateDate + 1 === 60 ? 0 : SStateDate + 1)
          : [],
    }
  }
  // 判断日期 等于 当前 日期
  const lessCurrent = current && moment(current).isBefore(moment(), 'day')
  if (lessCurrent) {
    return {
      disabledHours: () => [],
      disabledMinutes: () => [],
      disabledSeconds: () => [],
    }
  }
  return {
    disabledHours: () => range(0, 24).splice(H + 1, 24),
    disabledMinutes: () =>
      H === HCurrent ? range(0, 60).splice(M + 1, 60) : [],
    disabledSeconds: () =>
      H === HCurrent && M === MCurrent ? range(0, 60).splice(S + 1, 60) : [],
  }
}

// 处理兼容性 调用 全屏api
export const launchIntoFullscreen = (element) => {
  if (!element) {
    return false
  }
  if (element.requestFullscreen) {
    element.requestFullscreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen()
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen()
  }
}
// 退出全屏
export const exitFullscreen = (element) => {
  if (element.exitFullscreen) {
    element.exitFullscreen()
  } else if (element.mozCancelFullScreen) {
    element.mozCancelFullScreen()
  } else if (element.webkitExitFullscreen) {
    element.webkitExitFullscreen()
  }
}

/**
 * @description: 格式化 大整数 拼接 , 分割
 * @param { number } num
 * @return:
 */
export const toThousands = (num) => {
  return (num || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
}

/**
 * @description:  格式化 数字(支持数字) 借助 numeral.js
 * @param { number } num
 * @param { string } formatStr 格式化板式 【 0.000 保留3位小数 】【0,0.00 保留2位小数 且对 大于1000 使用, 分割】
 * @return: 非数字 返回显示 '--'
 */
export const formatMoney = (num, formatStr = '0,0.00') =>
  // eslint-disable-next-line no-restricted-globals
  !isNaN(parseFloat(num)) ? numeral(num).format(formatStr) : '--'
