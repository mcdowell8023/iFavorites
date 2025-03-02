/*** HarmonyOS 根据传入的字符串生成图片，并显示在界面上 ***/
import { UIContext } from '@kit.ArkUI';
import { common } from '@kit.AbilityKit';
import { ComponentContent, OverlayManager } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { CreateImageBuffer, CreateImageStyle } from './tools/auxTools/CreateImageBuffer';

import { image } from '@kit.ImageKit'


@Component
export struct CreateImageBufferTest {
  @State pixmap: image.PixelMap | undefined = undefined
  staticCreateImageBuffer = CreateImageBuffer.setCtext(this);
  staticCtext = CreateImageBuffer.setUIContext(this.getUIContext());
  @Builder
 TextBuilder(text:string, style: FMLabelStyle) {
   Stack(){
    Text(text)
          .fontSize(`${20}px`)
          .textAlign(TextAlign.Center)
          .textShadow({
            radius: 5,
            color: Color.Black,
            offsetX: 0,
            offsetY: 0
          })

    }.width('100%')
    .height(`${40}px`)
}

  build() {
    Row() {
      Column() {
         Image(this.pixmap)
        .margin(10)
        .height(100)
        .border({ color: Color.Black, width: 2 })
      }
      .width('100%')
      .onClick(() => {
        // 获取图片数据包
        CreateImageBuffer.getImageBufferByText('测试', new CreateImageStyle())
      })
    }
    .height('100%')
    .constraintSize({ maxWidth: '100%', maxHeight: '100%' })
  }
}
