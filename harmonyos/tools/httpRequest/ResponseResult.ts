
export default class ResponseResult<T> {
  code: string
  msg: string
  data?: T | string
  constructor() {
    this.code = ''
    this.msg = ''
  }

  set(res){
    if(typeof res === 'string'){
      this.code = '200'
      this.data = res as string
    }else {
      this.code = res?.error_code || ''
      this.msg = res?.error_msg || ''
      this.data = res?.data || null

      if (!this.data) {
        const data = {}
        Object.keys(res).forEach((key) => {
          if (key !== 'data' && key !== 'error_code' && key !== 'error_msg' && key !== 'success') {
            data[key] = res[key]
          }
        })
        this.data = data as  T;
      }
    }

    if(res?.success){
      this.code = '200'
    }
    return Object(this)
  }
}

