interface fLogOptions {
  modelName: string;
  logLevel?: number;
  filePath?: string;
}

export class fLog {
  public logLevel: number;

  public modelName: string;
  public filePath: string;

  // public fnName: string;
  // public keyName: string;
  // public keyValue: string;

  constructor(options: fLogOptions) {
    this.logLevel = 0;
    this.init(options);
  }

  static getLogger(options: fLogOptions): fLog {
    return new fLog(options);
  }

  public init(options: fLogOptions): void {
    // if (options && options.logLevel) {
    //   this.logLevel = options.logLevel;
    // } else {
    //   this.logLevel = 1;
    // }

    Object.assign(this, options);
  }

  getLogStr(json: Record<string, any>, tags?: string): string {
    return `fLog :: >> 🍰${this.modelName}${
      this.logLevel > 0 ? ` [⚠️${this.logLevel}]` : ""
    }${
      this.filePath ? ` <🏠${this.filePath}>` : ""
    } :: log :: ${tags} >> ${JSON.stringify(json)} `;
  }

  public log(message: Record<string, any>, tags?: string): void;
  public log(message: string, tags?: string): void;
  public log(message: string | Record<string, any>, tags?: string): void {
    if (message && typeof message === "object") {
      console.info(this.getLogStr(message, tags));
    } else {
      console.info(`${this.getLogStr({}, tags)} :: ${message}`);
    }
  }

  public warn(message: Record<string, any>, tags?: string): void;
  public warn(message: string, tags?: string): void;
  public warn(message: string | Record<string, any>, tags?: string): void {
    if (message && typeof message === "object") {
      console.warn(this.getLogStr(message, tags));
    } else {
      console.warn(`${this.getLogStr({}, tags)} :: ${message}`);
    }
  }

  public error(message: Record<string, any>, tags?: string): void;
  public error(message: string, tags?: string): void;
  public error(message: string | Record<string, any>, tags?: string): void {
    if (message && typeof message === "object") {
      console.error(this.getLogStr(message, tags));
    } else {
      console.error(`${this.getLogStr({}, tags)} :: ${message}`);
    }
  }
}
