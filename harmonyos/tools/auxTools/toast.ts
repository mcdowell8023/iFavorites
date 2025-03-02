import { promptAction } from '@kit.ArkUI';
import { BusinessError } from '@kit.BasicServicesKit';

export  const toast = (message: string, duration?: number) => {
  console.log(`showToast- message: ${message}`);
  try {


    promptAction.showToast({
      message,
      duration: 2000
    });
  } catch (error) {
    let message = (error as BusinessError).message
    let code = (error as BusinessError).code
    console.error(`showToast args error code is ${code}, message is ${message}`);
  };
};