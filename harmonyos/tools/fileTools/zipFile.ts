import { zlib, BusinessError } from "@kit.BasicServicesKit";
// import { fileIo as fs } from '@kit.CoreFileKit';

export async function zipFile(
  inFile: string,
  outFile: string,
  opt?: zlib.Options
): Promise<boolean> {
  // 代码中使用的路径需为应用的沙箱路径，如/data/storage/el2/base/haps,也可以通过context获取。
  // let inFile = '/xxx/filename.xxx';
  // let outFile = '/xxx/xxx.zip';
  let options: zlib.Options = opt || {
    level: zlib.CompressLevel.COMPRESS_LEVEL_DEFAULT_COMPRESSION,
    memLevel: zlib.MemLevel.MEM_LEVEL_DEFAULT,
    strategy: zlib.CompressStrategy.COMPRESS_STRATEGY_DEFAULT_STRATEGY,
  };

  return new Promise((resolve, reject) => {
    try {
      // zlib.zipFile
      zlib
        .compressFile(inFile, outFile, options)
        .then((data: void) => {
          console.info(
            "fileTools/zipFile >> zipFile ::log:: zipFile result is " +
              JSON.stringify(data)
          );
          resolve(true);
        })
        .catch((err: BusinessError) => {
          console.error(
            "fileTools/zipFile >> zipFile ::log:: error is " +
              JSON.stringify(err)
          );
          reject(false);
        });
    } catch (err) {
      console.error(
        "fileTools/zipFile >> unZipFile ::log:: error is " + JSON.stringify(err)
      );
      reject(false);
    }
  });
}

export async function unZipFile(
  inFile: string,
  outFile: string,
  opt?: zlib.Options
): Promise<boolean> {
  // 代码中使用的路径需为应用的沙箱路径，如/data/storage/el2/base/haps,也可以通过context获取。
  // let inFile = '/xxx/filename.zip';
  // let outFile = '/xxx/xxx';
  let options: zlib.Options = opt || {
    level: zlib.CompressLevel.COMPRESS_LEVEL_DEFAULT_COMPRESSION,
    memLevel: zlib.MemLevel.MEM_LEVEL_DEFAULT,
    strategy: zlib.CompressStrategy.COMPRESS_STRATEGY_DEFAULT_STRATEGY,
  };

  return new Promise((resolve, reject) => {
    try {
      // zlib.unzipFile
      zlib
        .decompressFile(inFile, outFile, options)
        .then((data: void) => {
          console.info(
            "fileTools/zipFile >> unZipFile ::log:: zipFile result is " +
              JSON.stringify(data)
          );
          resolve(true);
        })
        .catch((err: BusinessError) => {
          console.error(
            "fileTools/zipFile >> unZipFile ::log:: error is " +
              JSON.stringify(err)
          );
          reject(false);
        });
    } catch (err) {
      console.error(
        "fileTools/zipFile >> unZipFile ::log:: error is " + JSON.stringify(err)
      );
      reject(false);
    }
  });
}

export async function getCompressStatus(
  inFile: string,
  outFile: string,
  opt: zlib.Options
): Promise<boolean> {
  // 代码中使用的路径需为应用的沙箱路径，如/data/storage/el2/base/haps,也可以通过context获取。
  // let inFile = '/xxx/filename.xxx';
  // let outFile = '/xxx/xxx.zip';
  let options: zlib.Options = opt || {
    level: zlib.CompressLevel.COMPRESS_LEVEL_DEFAULT_COMPRESSION,
  };

  return new Promise((resolve, reject) => {
    try {
      zlib
        .compressFile(inFile, outFile, options)
        .then((data: void) => {
          console.info(
            "fileTools/zipFile >> getCompressStatus ::log:: compressFile success. data: " +
              JSON.stringify(data)
          );
          resolve(true);
        })
        .catch((errData: BusinessError) => {
          console.error(
            `fileTools/zipFile >> getCompressStatus ::log:: errData is errCode:${errData.code}  message:${errData.message}`
          );
          reject(false);
        });
    } catch (errData) {
      let code = (errData as BusinessError).code;
      let message = (errData as BusinessError).message;
      console.error(
        `fileTools/zipFile >> getCompressStatus ::log:: errData is errCode:${code}  message:${message}`
      );
      reject(false);
    }
  });
}

// 解压文件，解压的结果
export async function getDeCompressStatus(
  inFile: string,
  outFile: string,
  opt: zlib.Options
): Promise<boolean> {
  // 代码中使用的路径需为应用的沙箱路径，如/data/storage/el2/base/haps,也可以通过context获取。
  // let inFile = '/xxx/filename.zip';
  // let outFile = '/xxx/xxx';
  let options: zlib.Options = opt || {
    level: zlib.CompressLevel.COMPRESS_LEVEL_DEFAULT_COMPRESSION,
  };

  return new Promise((resolve, reject) => {
    try {
      zlib
        .decompressFile(inFile, outFile, options)
        .then((data: void) => {
          console.info(
            "fileTools/zipFile >> getDeCompressStatus ::log:: decompressFile success. data: " +
              JSON.stringify(data)
          );
          resolve(true);
        })
        .catch((errData: BusinessError) => {
          console.error(
            `fileTools/zipFile >> getDeCompressStatus ::log:: errData is errCode:${errData.code}  message:${errData.message}`
          );
          reject(false);
        });
    } catch (errData) {
      let code = (errData as BusinessError).code;
      let message = (errData as BusinessError).message;
      console.error(
        `fileTools/zipFile >> getDeCompressStatus ::log:: errData is errCode:${code}  message:${message}`
      );
      reject(false);
    }
  });
}
