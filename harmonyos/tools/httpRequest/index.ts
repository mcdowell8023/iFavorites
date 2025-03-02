// import http from  '@ohos.net.http'
// import { HttpResponse } from  '@ohos.net.http'
/***
 *  注意要确认 是否有网络请求权限
 *
 * 应用需要在module.json5配置文件的requestPermissions标签中声明权限。
 *
 *    "requestPermissions": [
{
        "name": "ohos.permission.INTERNET",
        "usedScene": {
          "abilities": [
            "entryability"
          ],
          "when":"inuse"
        }
      },
      {
        "name": "ohos.permission.GET_NETWORK_INFO",
        "usedScene": {
          "abilities": [
            "entryability"
          ],
          "when":"inuse"
        }
      },
        ]
 *
***/

import { http } from "@kit.NetworkKit";
import { JSON } from "@kit.ArkTS";
import ResponseResult from "./ResponseResult";
import { judgeHasNet } from "./network";


// import { toast } from "../auxTools/toast";
import { fLog } from "../auxTools/flog";

import {
  DefaultHeadersInterceptor,
  DefaultResponseInterceptor,
  HttpInterceptor,
  HttpResponseInterceptor,
} from "./InterceptUtil";


const FMLog = new fLog({
  modelName: "HttpRequest",
  logLevel: 1,
  filePath: "HttpRequest/index.ts"
});

interface RequestOption extends http.HttpRequestOptions {
  header?: Record<string, string>;
  url?: string;
  path?: string;
  params?: string | Object | ArrayBuffer;
}

const startsWithBaseUrl = (url = "") =>
  url.includes("https://") || url.includes("http://");

function assign(
  target: RequestOption,
  ...source: Object[]
): Record<string, Object | string> | RequestOption {
  for (let s of source) {
    for (let k of Object.keys(s)) {
      Object(target)[k] = Reflect.get(s, k);
    }
  }
  return target;
}

export class HttpRequest {
  private BASE_URL: string = "https://console.fengmap.com";
  private requestOption: RequestOption = {
    method: http.RequestMethod.POST, // http.RequestMethod.GET, // http.RequestMethod.POST
    header: { "Content-Type": "application/json" },
    path: "",
  };

  // 声明 拦截器数组
  private REQUEST_INTERCEPTORS: Array<HttpInterceptor> = [
    new DefaultHeadersInterceptor(),
  ];

  // 声明 响应拦截器数组
  private RESPONSE_INTERCEPTORS: Array<HttpResponseInterceptor> = [
    new DefaultResponseInterceptor(),
  ];
  private _isReadyNetwork = false;

  constructor() {
    this.checkedNetwork();
  }
  setBaseUrl(url: string) {
    this.BASE_URL = url;
  }
  checkedNetwork(): boolean {
    if (!judgeHasNet()) {
      // toast($r("app.string.no_network"));
      FMLog.error("No network (无网络状态，无法发送请求)",`http-Request.createRequest`);
      // toast("No network");
      this._isReadyNetwork = false;
      return false
    }
    this._isReadyNetwork = true;
    return true
  }
  checkedStatus(): boolean {
    if (!this.BASE_URL) {
      FMLog.error("BASE_URL not null (接口请求地址未设置，无法发送请求)",`http-Request.createRequest`);
      // throw Error("BaseUrl not null");
      return false
    }
    return true
  }
  createRequest(requestOption: RequestOption): HttpRequest {

    if (!this.checkedNetwork()) {
      throw Error("No network");
    }
    if (!this.checkedStatus()) {
      throw Error("Request Network");
    }


    let requestConfig = requestOption;
    let header: Record<string, string> = requestOption.header || {};
    if (!header["Content-Type"]) {
      header["Content-Type"] = "application/json"; // ContentType.JSON
    }
    requestConfig.header = header;
    this.requestOption = requestConfig;
    return this;
  }

  // 添加拦截器
  addRequestInterceptor(interceptor: HttpInterceptor) {
    this.REQUEST_INTERCEPTORS.push(interceptor);
  }
  // 添加拦截器
  addResponseInterceptor(interceptor: HttpResponseInterceptor) {
    this.RESPONSE_INTERCEPTORS.push(interceptor);
  }

  request<T>(option?: RequestOption) {
    // 检查网络状态 this._isReadyNetwork 为true 没必要检查网络状态了
    if (!this._isReadyNetwork && !this.checkedNetwork()) {
      throw Error("No network");
    }

    if (!this.checkedStatus()) {
      throw Error("Request Network");
    }

    let requestOption = this.requestOption;
    let url = option?.url ? option.url : option?.path || requestOption?.path;
    if (!url) {
      return;
    }
    // path 存在 https 或者 http 不使用 BASE_URL
    if (!startsWithBaseUrl(url)) {
      url = this.BASE_URL + url;
    }
    if (option) {
      if (option.params) {
        requestOption.extraData = option.params;
        // delete requestOption.params;
      }
      requestOption = assign(requestOption, option);
    }
    requestOption.path = url;

    // execute interceptor
    this.REQUEST_INTERCEPTORS.forEach((interceptor: HttpInterceptor) => {
      interceptor.intercept(requestOption);
    });
    // 每一个httpRequest对应一个HTTP请求任务，不可复用
    let httpRequest = http.createHttp();
    FMLog.log({requestOption},`http-Request.requestParams`);

    // toast('test-----随便写点啥就是测试下');
    // return result
    let serverData: ResponseResult<T> = new ResponseResult();
    return new Promise<ResponseResult<T>>((resolve, reject) => {
      httpRequest
        .request(url, requestOption)
        .then(async (res: http.HttpResponse) => {
          FMLog.log({res},`http-Request.res`);
          // 转换数据 格式化 服务端不靠谱的 返回值
          let result: ResponseResult<T> = await serverData.set(JSON.parse(`${res.result}`)) as ResponseResult<T>;
          if (res.responseCode === http.ResponseCode.OK && result.code == "200" ) {
            serverData = result;
            resolve(serverData);
          } else {
            // serverData.msg = $r('app.string.http_error_message') // `${}&${data.responseCode}`
            reject(serverData);
          }
          // console.log(`http-Request.result: ${JSON.stringify(serverData)}`);
          FMLog.log(serverData,`http-Request.serverData`);

          // 当该请求使用完毕时，调用destroy方法主动销毁
          httpRequest.destroy();
        })
        .catch((res) => {
          // 转换数据 格式化 服务端不靠谱的 返回值
          serverData.set(
            JSON.parse(`${res}`)
          ) as ResponseResult<T>;
          // serverData.msg = $r('app.string.http_error_message')
          // console.log(`http-Request.error: ${JSON.stringify(serverData)}`);

          FMLog.error(serverData,`http-Request.error.result`);


          reject(serverData);
          // 取消订阅HTTP响应头事件
          httpRequest.off("headersReceive");

          // 当该请求使用完毕时，调用destroy方法主动销毁
          httpRequest.destroy();
        });

    });
  }
}

export default new HttpRequest();
