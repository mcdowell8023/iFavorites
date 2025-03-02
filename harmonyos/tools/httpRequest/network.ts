import { connection } from '@kit.NetworkKit';
import { BusinessError } from '@kit.BasicServicesKit';

// 获取当前网络连接类型
export const getNetworkConnectionType = () => {
  try {
    let netHandle = connection.getDefaultNetSync();
    if (!netHandle || netHandle.netId === 0) {
      return;
    }
    let netCapability = connection.getNetCapabilitiesSync(netHandle);
    console.log('bearerTypes:', JSON.stringify(netCapability.bearerTypes));
  } catch (e) {
    let err = e as BusinessError;
    console.error('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
  }
}

// 判断当前网络是否可用
export const judgeHasNet = () => {
  try {
    let netHandle = connection.getDefaultNetSync();
    if (!netHandle || netHandle.netId === 0) {
      return false;
    }
    let netCapability = connection.getNetCapabilitiesSync(netHandle);
    let cap = netCapability.networkCap || [];
    if (cap.includes(connection.NetCap.NET_CAPABILITY_VALIDATED)) {
      //connection.NetCap.NET_CAPABILITY_VALIDATED，该值代表网络是通的，能够发起HTTP和HTTPS的请求。
      // 网络信息变化，网络可用
      return true;
    } else {
      // 网络信息变化，网络不可用
      return false;
    }
  } catch (e) {
    /*
    0 - 成功.
    201 - 缺少权限.
    401 - 参数错误.
    2100002 - 无法连接到服务.
    2100003 - 内部错误.
    */
    let err = e as BusinessError;
    let message = (err as BusinessError).message;
    let code = (err as BusinessError).code;
    console.error("JudgeHasNet: code:" + code + ';message:'+ message);
  }
  return false;
}


// import { connection } from '@kit.NetworkKit';
// import { BusinessError } from '@kit.BasicServicesKit';

// export class NetJudge{
//   public static conn:connection.NetConnection|undefined= undefined;

//   private static JUDGE_NET_TAG:string = 'NetJudge.currNet.isUseful';

//   public static netFlag:string = 'false'

//   private  static init(){
//     NetJudge.conn = connection.createNetConnection();
//     NetJudge.conn.register(()=>{
//       console.info('connection register success')
//     })

//     NetJudge.conn.on('netAvailable',(data)=>{
//       console.info('NetJudge  netAvailable ')
//       // AppStorage.setOrCreate(NetJudge.JUDGE_NET_TAG, NetJudge.judgeHasNet())
//     })

//     NetJudge.conn.on('netUnavailable',()=>{
//       console.info('NetJudge  netUnavailable ')
//       // AppStorage.setOrCreate(NetJudge.JUDGE_NET_TAG, NetJudge.judgeHasNet())
//     })

//     NetJudge.conn.on('netCapabilitiesChange', (data: connection.NetCapabilityInfo) => {
//       // AppStorage.setOrCreate(NetJudge.JUDGE_NET_TAG, NetJudge.judgeHasNet())
//     })

//     // 订阅网络连接信息变化事件。调用register后，才能接收到此事件通知
//     NetJudge.conn.on('netConnectionPropertiesChange', (data: connection.NetConnectionPropertyInfo) => {
//       // AppStorage.setOrCreate(NetJudge.JUDGE_NET_TAG, NetJudge.judgeHasNet())
//     });

//     NetJudge.conn.on('netLost',()=>{
//       // AppStorage.setOrCreate(NetJudge.JUDGE_NET_TAG, NetJudge.judgeHasNet())
//     })

//   }

//   public static regist(){
//     if(NetJudge.conn == undefined){
//       NetJudge.init()
//     }
//   }

//   public static judgeHasNet(): boolean {
//     try { // 获取当前网络连接
//       let netHandle = connection.getDefaultNetSync()

//       // 0-100 为系统预留的连接
//       if (!netHandle || netHandle.netId < 100) {
//         return false;
//       }

//       // 获取连接的属性
//       let netCapa = connection.getNetCapabilitiesSync(netHandle);
//       let cap = netCapa.networkCap;
//       if (!cap) {
//         return false;
//       }

//       for (let em of cap) {
//         if (connection.NetCap.NET_CAPABILITY_VALIDATED == em) {
//           return true;
//         }
//       }
//     } catch (e) {
//       let err = e as BusinessError
//       console.info('get netInfo error ：' + JSON.stringify(err))
//     }
//     return false;
//   }
// }