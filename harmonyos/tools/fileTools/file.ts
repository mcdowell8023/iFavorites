/*
 * @Author: mcdowell
 * @Date: 2025-01-08 19:30:07
 * @LastEditors: mcdowell
 * @LastEditTime: 2025-01-09 23:58:19
 */
import { http } from "@kit.NetworkKit";
import { zlib, BusinessError, request } from "@kit.BasicServicesKit";
import { fileIo, Filter, hash, ListFileOptions } from "@kit.CoreFileKit";
import { buffer, JSON, util } from "@kit.ArkTS";
import { cryptoFramework } from "@kit.CryptoArchitectureKit";
import { resourceManager } from "@kit.LocalizationKit";
import { FMLog } from "../../utils/FMLog";

// import { UIAbility } from '@kit.AbilityKit';
// import { window } from '@kit.ArkUI';

/**
 * @description: 通用 文件操作
 * @param {string} filePath: 要获取的文件路径
 * @param {string} fn: 要执行的函数名
 *                     unlinkSync ： 删除 一个文件
 *                     rmdirSync  ： 删除一个目录
 *                     mkdirSync  ： 创建一个目录
 *                     statSync   ： 获取文件信息
 * @return {*}
 */
export async function getFileByFNName<T>(
  filePath: string,
  fn: string
): Promise<T | null> {
  return new Promise(async (resolve, reject) => {
    try {
      let res = (await fileIo[fn](filePath)) as T;
      if (res) {
        console.info(
          `fileTools/file >> getFileByFNName - ${fn} ::log::  ${fn} [filePath :${filePath}] success: ${res}`
        );
        resolve(res);
      } else {
        console.info(
          `fileTools/file >> getFileByFNName - ${fn} ::log::  ${fn} [filePath :${filePath}]  failed`
        );
        resolve(null);
      }
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      console.error(
        `fileTools/file >> getFileByFNName - ${fn} ::log::  ${fn} [filePath :${filePath}] failed with error message: ${err.message}, error code: ${err.code}`
      );
      reject(null);
    }
  });
}

/**
 * @description: 获取文件信息
 * @param {string} filePath: 要获取的文件路径
 * @return {*}
 */
export async function getFileInfo(filePath: string): Promise<fileIo.Stat> {
  return getFileByFNName<fileIo.Stat>(filePath, "statSync");
}
// 获取文件是否存在
/**
 * @description: 获取文件是否存在
 * @param {string} filePath 要检查的文件路径
 * @return { Promise<boolean | null> }
 */
export async function isFileExists(filePath: string): Promise<boolean | null> {
  return getFileByFNName<boolean>(filePath, "accessSync");
}

/**
 * @description: 检查目录是否存在，不存在会自动创建
 * @param {string} filePath 要检查的目录路径
 * @param {boolean} isRecurs 是否递归创建目录 （默认递归创建）
 * @return {*}
 */
export async function checkDir(
  filePath: string,
  isRecurs = true
): Promise<boolean> {
  const isExists = await isFileExists(filePath);
  console.info(
    `fileTools/file >> checkDir ::log:: 目录是否存在，不存在会自动创建 >> isExists: ${isExists}`
  );
  if (!isExists) {
    await fileIo.mkdirSync(filePath, isRecurs); //  !!(await getFileByFNName<boolean>(filePath, "mkdirSync"));
  }
  return true;
}

/**
 * @description: 创建临时目录（每次创建的都是 唯一目录路径） 避开文件存在导致的问题
 * @param {string} filePath 要检查的目录路径
 * @return {*}
 */
export async function mkdTemp(filePath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      let res = await fileIo.mkdtempSync(filePath + "/XXXXXX");
      if (res) {
        console.info(`fileTools/file >> mkdTemp ::log:: success: ${res}`);
        resolve(res);
      } else {
        console.info(`fileTools/file >> mkdTemp ::log:: failed`);
        resolve("");
      }
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      console.error(
        `fileTools/file >> mkdTemp ::log:: failed with error message: ${err.message}, error code: ${err.code}`
      );
      reject("");
    }
  });
}

// 读取文件内容
export async function readFile(filePath: string): Promise<ArrayBuffer> {
  let file = await fileIo.open(filePath, fileIo.OpenMode.READ_ONLY);
  let buffer = new ArrayBuffer(fileIo.statSync(filePath).size);
  await fileIo.read(file.fd, buffer);
  await fileIo.close(file.fd);
  return buffer;

  // return new util.TextDecoder().decodeToString(buffer);
}

// 写入文件内容 （文本）
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  let file = await fileIo.open(
    filePath,
    fileIo.OpenMode.WRITE_ONLY | fileIo.OpenMode.CREATE
  );
  await fileIo.write(file.fd, content);
  await fileIo.close(file.fd);
}

// 获取文件列表
export async function getListFile(
  pathDir: string,
  listFileOption?: ListFileOptions
): Promise<string[] | null> {
  return new Promise(async (resolve, reject) => {
    try {
      // let listFileOption: ListFileOptions = {
      //   recursion: false,
      //   listNum: 0,
      //   filter: {
      //     suffix: [".png", ".jpg", ".jpeg"],
      //     displayName: ["*abc", "efg*"],
      //     fileSizeOver: 1024,
      //   },
      // };
      let filenames = await fileIo.listFileSync(pathDir, listFileOption);
      if (filenames) {
        console.info(
          `fileTools/file >> getListFile ::log:: success: ${filenames}`
        );
        resolve(filenames);
      } else {
        console.info(`fileTools/file >> getListFile ::log:: failed`);
        resolve(null);
      }
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      console.error(
        `fileTools/file >> getListFile ::log:: failed with error message: ${err.message}, error code: ${err.code}`
      );
      reject(null);
    }
  });
}
/**
 * 计算文件 md5
 * @param fileUrl 文件路径
 * @returns 文件md5
 */
export async function calFileMd5(fileUrl: string): Promise<string | null> {
  try{
    return await hash.hash(fileUrl, "md5");
  }catch (e){
    FMLog.i("file.ts@calFileMd5 >> calFileMd5 : ",e);
  }
  return null;

}





// 测试 RawFile 相关
// export async function uploadFile(
//   filePath: string,
//   uploadUrl: string
// ): Promise<void> {
// }

/**
 * @description: 下载文件
 * @param {string} downloadUrl: 要下载的文件的url
 * @param {string} savePath: 保存路径
 * @return {*}
 */
export async function downloadFile(
  downloadUrl: string,
  savePath: string,
  context
): Promise<BusinessError> {
  return new Promise(async (resolve, reject) => {
    // 下载文件
    try {
      request
        .downloadFile(context, {
          url: downloadUrl,
          filePath: savePath,
        })
        .then((downloadTask: request.DownloadTask) => {
          downloadTask.on("complete", () => {
            console.log(
              "fileTools/file >> downloadFile ::log:: complete 文件下载成功，保存路径：",
              savePath
            );
            resolve({
              code: 200,
              message: "文件下载成功",
              name: "downloadFile",
            });
          });
        })
        .catch((err: BusinessError) => {
          console.error(
            `fileTools/file >> downloadFile ::log:: catch:Invoke downloadTask failed, code is ${err.code}, message is ${err.message}`
          );
          reject(err);
        });
    } catch (error) {
      let err: BusinessError = error as BusinessError;
      console.error(
        `fileTools/file >> downloadFile ::log:: try-catch:Invoke downloadFile failed, code is ${err.code}, message is ${err.message}`
      );
      reject(err);
    }
  });
}

/*** arkts 读取 RawFile 文件 ***/
/**
 * @description: 拷贝 rawfile 文件到沙箱路径
 * @param {string} fileName: 要拷贝的文件  '2001.zip'
 * @param {string} sanboxPath: 拷贝后的文件保存路径   'filesDir/2001'
 * @return {*}
 * @example
    copyRawFileZip('2001.zip', this.getDirPathTheme(), applicationContext);
    copyRawFileZip('2001.zip', '/data/storage/el2/base/files/Fmap/theme', applicationContext);
 */

export async function copyRawFileZip(
  fileName: string,
  sandboxPath: string,
  context: any
): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    console.log("copyRawFileZip: 沙箱路径：" + sandboxPath);
    /**
     * 通过fd来进行拷贝，避免文件过大的内存占用问题
     * data.fd是hap包的fd，data.offset表示目标文件在hap包中的偏移，data.length表示目标文件的长度
     */

    try {
      context.resourceManager.getRawFd(fileName, async (err, data) => {
        console.info(
          `copyRawFileZip :: log :: context.resourceManager.getRawFd: fileName: ${fileName}, >> ${JSON.stringify(
            err
          )}}`
        );
        if (err != null) {
          console.error(
            `copyRawFileZip :: log :: context.resourceManager.getRawFd: fileName: ${fileName}, >> ${JSON.stringify(
              err
            )}}`
          );
          resolve(false);
          return;
        }

        // let tmpPath = fileIo.mkdtempSync(sanboxPath + "/XXXXXX");
        await checkDir(sandboxPath);
        let dest = fileIo.openSync(sandboxPath+"/"+fileName,
          fileIo.OpenMode.CREATE | fileIo.OpenMode.READ_WRITE
        );
        console.log("copyRawFileZip.dest: 拷贝路径：" + dest);
        let bufsize = 4096;
        let buf = new ArrayBuffer(bufsize);
        let off = 0,
          len = 0,
          readedLen = 0;
        /**
         * 通过buffer将rawfile文件内容copy到沙箱路径
         */
        while (
          (len = fileIo.readSync(data.fd, buf, {
            offset: data.offset + off,
            length: bufsize,
          }))
        ) {
          readedLen += len;
          fileIo.writeSync(dest.fd, buf, { offset: off, length: len });
          off = off + len;
          if (data.length - readedLen < bufsize) {
            bufsize = data.length - readedLen;
          }
        }
        fileIo.close(dest.fd);

        context.resourceManager.closeRawFd(fileName, (err, data) => {
          if (err != null) {
            console.error(
              `copyRawFileZip :: log :: context.resourceManager.closeRawFd >> ${JSON.stringify(
                err
              )}}`
            );
          } else {
            console.log("copyRawFileZip :: log :: close success");
          }
        });

      });
    } catch (error) {
      let code = (error as BusinessError).code;
      let message = (error as BusinessError).message;
      console.error(
        `copyRawFileZip failed, error code: ${code}, message: ${message}.`
      );
    }
  });
}


function resove(str: string): any {
  throw new Error("Function not implemented.");
}

//   this.context.resourceManager.getRawFileContentSync("1513361948621471746.fmap");

// try {
//   this.context.resourceManager.getRawFileContent("1513361948621471746.fmap", (error: BusinessError, value: Uint8Array) => {
//     if (error != null) {
//       console.error("getRawFileContent:error is " + error);
//     } else {
//       let rawFile = value;
//       console.log(`getRawFileContent-rawFile: ${rawFile}`)
//     }
//   });
// } catch (error) {
//   let code = (error as BusinessError).code;
//   let message = (error as BusinessError).message;
//   console.error(`callback getRawFileContent failed, error code: ${code}, message: ${message}.`);
// }

// // 测试 native 侧读取 rawfile 文件
// hilog.isLoggable(0x0000, 'testTag-rawfile：', hilog.LogLevel.INFO);
// let rawfilelist = egl.getFileList(this.resmgr, ""); //传入资源对象，以及访问的rawfile文件夹名称
// console.log("testTag-rawfile：rawfilelist " + rawfilelist);
// let rawfileContet = egl.getRawFileContent(this.resmgr, "1513361948621471746.fmap");
// console.log("testTag-rawfile：rawfileContet " + rawfileContet);
// let rawfileDescriptor = egl.getRawFileDescriptor(this.resmgr, "1513361948621471746.fmap");
// console.log("testTag-rawfile：getRawFileDescriptor " + rawfileDescriptor.fd, rawfileDescriptor.offset, rawfileDescriptor.length);
// console.log(`testTag-rawfile：getRawFileDescriptor strJson: ${JSON.stringify(rawfileDescriptor)}` );
// let ret = egl.isRawDir(this.resmgr, "1513361948621471746.fmap");

// console.log("testTag-rawfile：isRawDir " + ret);
