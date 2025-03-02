import pako from "pako";
import { fileIo as fs } from "@kit.CoreFileKit";
/**
 * 压缩gz文件方法
 *
 * @since 7
 * @permission N
 * @param {string} src - 文件路径
 * @param {string} dest - 压缩后的文件路径
 * @returns {void | Promise<boolean>} return返回Promise否则返回true或false
 */
export async function gzipFile(src: string, dest: string): Promise<boolean> {
  try {
    let stat = fs.statSync(src);
    const buf = new ArrayBuffer(stat.size);
    const reader = fs.openSync(src, fs.OpenMode.READ_ONLY);
    fs.readSync(reader.fd, buf);
    const writer = fs.openSync(
      dest,
      fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE
    );
    /*
     *  level: Z_DEFAULT_COMPRESSION, -1
        method: Z_DEFLATED, 8
        chunkSize: 16384,
        windowBits: 15,
        memLevel: 8,
        strategy: Z_DEFAULT_STRATEGY
     * */
    // const options = { level: 9 };
    fs.writeSync(writer.fd, pako.gzip(new Uint8Array(buf))?.buffer);
    fs.closeSync(reader);
    fs.closeSync(writer);
    return true;
  } catch (error) {
    console.error(
      "fileTools/gzip >> gzipFile ::log:: gzipFile error: " + error
    );
    return false;
  }
}

/**
 * 解压gz文件方法
 *
 * @since 7
 * @permission N
 * @param {string} src - 解压缩的.gz文件的路径和名称.
 * @param {string} target - 解压缩的目标文件路径.
 * @returns {void | Promise<boolean>} return返回Promise否则返回true或false
 */
export async function unGzipFile(
  src: string,
  target: string
): Promise<boolean> {
  try {
    const reader = fs.openSync(src, fs.OpenMode.READ_ONLY);
    const stat = fs.statSync(src);
    const buf = new ArrayBuffer(stat.size);
    await fs.read(reader.fd, buf);
    const data: string | Uint8Array | undefined = pako.ungzip(
      new Uint8Array(buf)
    );
    if (typeof data == "string") {
      console.error(`fileTools/gzip >> unGzipFile ::log:: unGzipFile [src: $\{src},target: $\{target}] data:  ${data}`);
      return false;
    }
    const writer = fs.openSync(
      target,
      fs.OpenMode.READ_WRITE | fs.OpenMode.CREATE
    );
    fs.writeSync(writer.fd, data?.buffer);
    fs.closeSync(writer);
    fs.closeSync(reader);
    return true;
  } catch (error) {
    console.error(
      `fileTools/gzip >> unGzipFile ::log:: unGzipFile [src: ${src},target: ${target}] error: ${error}`
    );
    return false;
  }
}

// export async function ungzipTest(gzip:Uint8Array): Promise<boolean> {
//   try {
//     // let array = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
//     const options: pako.DeflateOptions = { gzip: true, level: 9 };
//     // let gzip: Uint8Array | undefined = pako.gzip(array, options);
//     let ungzip: string | Uint8Array | undefined = pako.ungzip(gzip);
//     this.ungzip1 = ungzip?.toString();
//     let result: boolean = ungzip?.toString() === array.toString();
//     // prompt.showToast({ message: result.toString(), duration: 4000 });
//     return result;
//   } catch (error) {
//     console.error(
//       "fileTools/gzip >> unGzipFile ::log:: unGzipFile error: " + error
//     );
//     return false;
//   }
// }
