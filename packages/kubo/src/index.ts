import axios, { AxiosRequestConfig } from "axios";
import { Readable, Writable } from "stream";
import { ReadStream } from "fs";
import { JWT } from "./jwt.js";

export interface IKuboOption {
  data: any;
}

export interface IKuboArg {
  path: string;
  arg: string;
  long: boolean;
  U: boolean;
  format: string;
  hash: boolean;
  size: boolean;
  "with-local": boolean;
  parents: boolean;
  recursive: boolean;
  force: boolean;
  "cid-version": string;
  offset: number;
  count: number;
  progress: boolean;
}

export type TFilesLsArgs = Partial<Pick<IKuboArg, "long" | "path" | "U">>;

export type TFilesLsEntry = {
  Hash: string;
  Name: string;
  Size: number;
  Type: number;
};

export type TFilesStatArgs = Partial<
  Pick<IKuboArg, "arg" | "format" | "hash" | "size" | "with-local">
>;

export type TFilesStatEntry = {
  Blocks: number;
  CumulativeSize: number;
  Hash: string;
  Local: boolean;
  Size: number;
  SizeLocal: number;
  Type: string;
  WithLocality: boolean;
};

export type TFilesAdd = {
  Name: string;
  Hash: string;
  Size: number;
};

export type TFilesRmArgs = Partial<
  Pick<IKuboArg, "arg" | "recursive" | "force">
>;

export type TFilesMkdirArgs = Partial<
  Pick<IKuboArg, "arg" | "parents" | "cid-version" | "hash">
>;

export type TFilesReadArgs = Partial<
  Pick<IKuboArg, "arg" | "offset" | "count">
>;

export type TPinAddArgs = Partial<
  Pick<IKuboArg, "arg" | "recursive" | "progress">
>;

export type TPinAdd = {
  Pins: string[];
  Progress: number;
};

export type TNamePublish = {
  Name: string;
  Value: string;
};

export type TNameResolve = {
  Path: string;
};

export type TNameKeyList = {
  Keys: {
    Id: string;
    Name: string;
  }[];
};

export const REQUIRED_AUTHENTICATION = [
  "files/rm",
  "files/cp",
  "files/writeStream",
  "files/readStream",
  "add",
  "pin/add",
  "name/publish",
];

export type TKuboAuthentication = {
  userName: string;
  secretKey: string;
};

export type TKuboConfig = {
  protocol: "http" | "https";
  host: string;
  port: number;
  apiPath: string;
  authentication?: TKuboAuthentication;
};

export class RequestBuilder {
  public options: Partial<IKuboOption>;

  public command: string;

  public args: Partial<IKuboArg>;

  constructor(
    comand: string,
    defaultOpt: Partial<IKuboOption> = {},
    defautArgs: Partial<IKuboArg> = {}
  ) {
    this.command = comand;
    this.args = defautArgs;
    this.options = defaultOpt;
  }

  public option<
    K extends keyof Partial<IKuboOption>,
    V extends Partial<IKuboOption>[K]
  >(key: K, value: V): RequestBuilder {
    this.options[key] = value;
    return this;
  }

  public arg<K extends keyof Partial<IKuboArg>, V extends Partial<IKuboArg>[K]>(
    key: K,
    value: V
  ): RequestBuilder {
    this.args[key] = value;
    return this;
  }

  public static new(
    comand: string,
    defaultOpt: Partial<IKuboOption> = {},
    defautArgs: Partial<IKuboArg> = {}
  ) {
    return new RequestBuilder(comand, defaultOpt, defautArgs);
  }
}

export class KuboClient {
  public config: TKuboConfig = {
    protocol: "http",
    host: "127.0.0.1",
    port: 5001,
    apiPath: "/api/v0",
  };

  public jwt?: JWT;

  constructor(config: Partial<TKuboConfig> = {}) {
    this.config = { ...this.config, ...config };
    if (typeof config.authentication !== "undefined") {
      this.jwt = new JWT(
        config.authentication.userName,
        config.authentication.secretKey
      );
    }
  }

  private getUrl(command: string) {
    return `${this.config.protocol}://${this.config.host}:${this.config.port}${this.config.apiPath}/${command}`;
  }

  public async exist(path: string): Promise<boolean> {
    try {
      await this.filesStat({ arg: path });
      return true;
    } catch (e) {
      return false;
    }
  }

  public async existFile(path: string): Promise<boolean> {
    try {
      const result = await this.filesStat({ arg: path });
      return result.Type === "file";
    } catch (e) {
      return false;
    }
  }

  public async existDir(path: string): Promise<boolean> {
    try {
      const result = await this.filesStat({ arg: path });
      return result.Type === "directory";
    } catch (e) {
      return false;
    }
  }

  public async filesLs(
    args: TFilesLsArgs = { path: "/" }
  ): Promise<TFilesLsEntry[]> {
    const { Entries } = await this.executePost<{ Entries: TFilesLsEntry[] }>(
      new RequestBuilder("files/ls", {}, args)
    );
    return Entries;
  }

  public async filesStat(
    args: TFilesStatArgs = { arg: "/" }
  ): Promise<TFilesStatEntry> {
    return this.executePost<TFilesStatEntry>(
      new RequestBuilder("files/stat", {}, args)
    );
  }

  public async filesRm(args: TFilesRmArgs): Promise<void> {
    await this.executePost<TFilesStatEntry>(
      new RequestBuilder("files/rm", {}, args)
    );
  }

  public async filesAdd(
    filename: string,
    filecontent: Uint8Array
  ): Promise<TFilesAdd> {
    const fileForm = new FormData();
    fileForm.append("file", new Blob([filecontent]), filename);
    return this.executePost<TFilesAdd>(
      new RequestBuilder("add", <any>fileForm, {}),
      {
        "Content-Type": "multipart/form-data",
      }
    );
  }

  public async filesCp(src: string, dst: string) {
    return this.executePost<TFilesAdd>(
      new RequestBuilder(`files/cp?arg=${src}&arg=${dst}&parents=true`)
    );
  }

  public async filesMkdir(args: TFilesMkdirArgs) {
    return this.executePost(new RequestBuilder("files/mkdir", {}, args));
  }

  public async filesWrite(path: string, content: Uint8Array) {
    const filename = path.split("/").pop();
    const addResult = await this.filesAdd(filename!, content);
    return this.filesCp(`/ipfs/${addResult.Hash}`, path);
  }

  public async filesRead(args: TFilesReadArgs = {}): Promise<ArrayBuffer> {
    return this.executePost(
      new RequestBuilder("files/read", {}, args),
      {},
      { responseType: "arraybuffer", responseEncoding: "binary" }
    );
  }

  public async filesReadStream(path: string): Promise<Readable> {
    const requestBuilder = new RequestBuilder("files/readStream", {}, { path });
    return this.executeGet<Readable>(
      requestBuilder,
      {},
      { responseType: "stream" }
    );
  }

  public async filesWriteStream(path: string, stream: Readable): Promise<any> {
    const requestBuilder = new RequestBuilder(
      "files/writeStream",
      { data: stream },
      { path }
    );
    return this.executePost<any>(requestBuilder, {
      "Content-Type": "application/octet-stream",
    });
  }

  public async pinAdd(args: TPinAddArgs): Promise<TPinAdd> {
    return this.executePost(new RequestBuilder("pin/add", {}, args));
  }

  public async namePublish(arg?: string): Promise<TNamePublish> {
    const path =
      typeof arg === "undefined"
        ? `/ipfs/${(await this.filesStat({ arg: "/" })).Hash}`
        : arg;
    return this.executePost(
      new RequestBuilder("name/publish", {}, { arg: path })
    );
  }

  public async nameResolve(arg: string): Promise<TNameResolve> {
    return this.executePost(new RequestBuilder("name/resolve", {}, { arg }));
  }

  public async keyList() {
    return (
      await this.executePost<TNameKeyList>(new RequestBuilder("key/list"))
    ).Keys;
  }

  private async executePost<T>(
    requestBuilder: RequestBuilder,
    configHeaders: any = {},
    requestOptions: AxiosRequestConfig = {}
  ): Promise<T> {
    const headers =
      typeof this.jwt !== "undefined" &&
      REQUIRED_AUTHENTICATION.includes(requestBuilder.command.toLowerCase())
        ? {
            ...{
              "Content-Type": "application/json",
              Authorization: this.jwt.authentication(),
            },
            ...configHeaders,
          }
        : {
            ...{ "Content-Type": "application/json" },
            ...configHeaders,
          };

    const res = await axios.post(
      this.getUrl(requestBuilder.command),
      requestBuilder.options.data,
      {
        ...requestOptions,
        params: requestBuilder.args,
        headers,
      }
    );
    return res.data;
  }

  private async executeGet<T>(
    requestBuilder: RequestBuilder,
    configHeaders: any = {},
    requestOptions: AxiosRequestConfig = {}
  ): Promise<T> {
    const headers =
      typeof this.jwt !== "undefined" &&
      REQUIRED_AUTHENTICATION.includes(requestBuilder.command.toLowerCase())
        ? {
            ...{
              "Content-Type": "application/json",
              Authorization: this.jwt.authentication(),
            },
            ...configHeaders,
          }
        : {
            ...{ "Content-Type": "application/json" },
            ...configHeaders,
          };
    const res = await axios.get(this.getUrl(requestBuilder.command), {
      ...requestOptions,
      params: requestBuilder.args,
      headers,
    });
    return res.data;
  }
}
