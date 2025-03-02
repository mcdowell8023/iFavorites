import { componentSnapshot } from "@kit.ArkUI"
import { image } from "@kit.ImageKit"
import { FMLog } from "../../utils/FMLog"
import { Context, UIContext, FMMapType, FMWidget } from "../../index.d"
import { FMMapViewComponent } from "../../FMMapViewComponent"
import { BusinessError } from "@kit.BasicServicesKit"
import { FMLabelStyle } from "../../map/marker/FMLabel"

// import { buffer } from '@kit.ArkTS';
// import { util } from '@kit.ArkTS';
type FMMViewComponent = FMMapViewComponent

export interface CreateImageResult {
    code: number
    message: string
    buffer: ArrayBuffer | null
    imageInfo?: image.ImageInfo | null
}

export interface CreateImageStyle {
    strokeColor?: number;
    strokeWidth: number | 2.0;

    fontSize: number;
    // fontStyle: string | "sans-serif";

    width: number;
    height: number;
    frameStokeColor: string;
    frameFillColor: string;
    frameRadius: number;
}



export class CreateImageBuffer {

    static _this: FMMViewComponent
    static uiContext: UIContext

    static setCtext(_this: FMMViewComponent) {

        FMLog.i("CreateImageBuffer.ets@setCtext >> uiContext -->", {_this: !!_this})
        CreateImageBuffer._this = _this
    }
    static setUIContext(uiContext: UIContext) {
      CreateImageBuffer.uiContext = uiContext;
    }

    static getUIContext() {
        return CreateImageBuffer.uiContext
    }

    static getImageBufferByText(text: string, style: FMLabelStyle): Promise<BusinessError | CreateImageResult> {
        return new Promise(async (resolve, reject) => {
        FMLog.i("CreateImageBuffer.ets@getImageBufferByText >> uiContext -->", {text});

        try {
            // 使用createFromBuilder方法创建一个Pixmap对象，并返回一个Promise对象。
            const componentSnapshot = CreateImageBuffer.getUIContext().getComponentSnapshot()
            // 获取 图片数据包
            const pixmap: image.PixelMap =
                await componentSnapshot.createFromBuilder(
                    () => {CreateImageBuffer._this.TextBuilder(text, style)},
                    0,
                    true,
                    { scale: 1, waitUntilRenderFinished: true }
                )

            // 测试 截图图片
            CreateImageBuffer._this.pixmap = pixmap

            // 创建图片编码器
            const imagePackerApi: image.ImagePacker = image.createImagePacker()
            if (imagePackerApi === null) {
                resolve({ code: 400,message: "faild",buffer: null,})
            }
            // 获取图片信息
            const imageInfo: image.ImageInfo = await pixmap.getImageInfo();

            // 将Pixmap对象编码为指定格式的数据
            let opts: image.PackingOption = {
                format: "image/png",
                quality: 100,
                // bufferSize: style.width * style.height * 4 ,
            }
             resolve({
                        code: 200,
                        message: "success",
                        imageInfo,
                        buffer: data
                        buffer: pixelMapGrayScale(pixmap,text),
                    })
            // imagePackerApi
            //     .packToData(pixmap, opts)
            //     .then((data: ArrayBuffer) => {

            //         resolve({
            //             code: 200,
            //             message: "success",
            //             imageInfo,
            //             buffer: data
            //         })
            //     })
            //     .catch((error: BusinessError) => {
            //         reject(error)
            //         FMLog.le(
            //             "CreateImageBuffer.ets@getImageBufferByText.imagePackerApi.packing >> catch -->",
            //             `Failed to pack the image.code ${error.code},message is ${error.message}`
            //         )
            //     })
        } catch (error) {
            let err: BusinessError = error as BusinessError
            reject(err)
            FMLog.e(
                "CreateImageBuffer.ets@componentSnapshot.createFromBuilder >> try catch -->",
                {
                    err,
                }
            )
        }
        })
    }
}
//ARGB_8888
function bgra2rgba(shuju: ArrayBuffer) {
    let changdu: number = shuju.byteLength;
    let huanchongqu: ArrayBuffer = new ArrayBuffer(changdu);
    let shitu0 = new DataView(shuju);
    let shuju2 = new DataView(huanchongqu);
    for (let i = 0; i < changdu; i += 4) {
        shuju2.setUint8(i, shitu0.getUint8(i+3));   // B -> A
        shuju2.setUint8(i + 1, shitu0.getUint8(i+2)); // G -> R
        shuju2.setUint8(i + 2, shitu0.getUint8(i+1));    // R -> G
        shuju2.setUint8(i + 3, shitu0.getUint8(i)); // A -> B
    }
    return shuju2.buffer;
}


function pixelMapGrayScale(pixelMap:PixelMap,text : string){

    let width = pixelMap.getImageInfoSync().size.width
    let height = pixelMap.getImageInfoSync().size.height
    let readBuffer: ArrayBuffer = new ArrayBuffer(width * height * 4)
    pixelMap.readPixelsToBufferSync(readBuffer)
    let byteBuffer:Uint32Array = new Uint32Array(readBuffer)
    let byteBufferTemp:Uint8Array = new Uint8Array(new ArrayBuffer(width * height * 4))
    // if(text ==='G012'){
    //     console.debug('灰度化处理前像素颜色[b,g,r,a,b,g,r,a....]=='+ byteBuffer.toString())
    // }
    for (let index = 0; index < (width*height); index++) {

        let rgb = byteBuffer[index]
        let red = (rgb >> 0) & 0x000000ff
        let green = (rgb >> 8) & 0x000000ff
        let blue = (rgb >> 16) & 0x000000ff
        let alpha = (rgb >> 24) & 0x000000ff

        //let gray = (0.299 * red + 0.587 * green + 0.114 * blue);
        let gray = (red + green + blue)/3.0
        byteBufferTemp[index*4] = gray
        byteBufferTemp[index*4+1] = gray
        byteBufferTemp[index*4+2] = gray
        byteBufferTemp[index*4+3] = alpha
    }
    // if(text ==='G012') {
    //     console.debug('灰度化处理后像素颜色[b,g,r,a,b,g,r,a....]=='+ byteBufferTemp.toString())
    // }
    // let color: ArrayBuffer = byteBufferTemp.buffer as ArrayBuffer;
    // let opts: image.InitializationOptions = { editable: true, pixelFormat: pixelMap.getImageInfoSync().pixelFormat, size: { height: height, width: width } }
    // let pixelMapTemp : image.PixelMap = image.createPixelMapSync(color, opts);
    // CreateImageBuffer._this.pixmap = pixelMapTemp
    return byteBufferTemp;
}


