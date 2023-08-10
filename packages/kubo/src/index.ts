import axios from "axios";

export interface IKuboOption {}

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

export type TKuboConfig = {
  protocol: "http" | "https";
  host: string;
  port: number;
  apiPath: string;
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
    defautArgs: Partial<IKuboOption> = {}
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

  constructor(config: Partial<TKuboConfig> = {}) {
    this.config = { ...this.config, ...config };
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
    const { Entries } = await this.execute<{ Entries: TFilesLsEntry[] }>(
      new RequestBuilder("files/ls", {}, args)
    );
    return Entries;
  }

  public async filesStat(
    args: TFilesStatArgs = { arg: "/" }
  ): Promise<TFilesStatEntry> {
    return this.execute<TFilesStatEntry>(
      new RequestBuilder("files/stat", {}, args)
    );
  }

  public async filesRm(args: TFilesRmArgs): Promise<void> {
    await this.execute<TFilesStatEntry>(
      new RequestBuilder("files/rm", {}, args)
    );
  }

  public async filesAdd(
    filename: string,
    filecontent: Uint8Array
  ): Promise<TFilesAdd> {
    const fileForm = new FormData();
    fileForm.append("file", new Blob([filecontent]), filename);
    return this.execute<TFilesAdd>(
      new RequestBuilder("add", <any>fileForm, {}),
      {
        "Content-Type": "multipart/form-data",
      }
    );
  }

  public async filesCp(src: string, dst: string) {
    return this.execute<TFilesAdd>(
      new RequestBuilder(`files/cp?arg=${src}&arg=${dst}&parents=true`)
    );
  }

  public async filesMkdir(args: TFilesMkdirArgs) {
    return this.execute(new RequestBuilder("files/mkdir", {}, args));
  }

  public async filesWrite(path: string, content: Uint8Array) {
    const filename = path.split("/").pop();
    const addResult = await this.filesAdd(filename!, content);
    return this.filesCp(`/ipfs/${addResult.Hash}`, path);
  }

  public async filesRead(args: TFilesReadArgs = {}): Promise<Uint8Array> {
    return new TextEncoder().encode(
      await this.execute(new RequestBuilder("files/read", {}, args))
    );
  }

  public async pinAdd(args: TPinAddArgs): Promise<TPinAdd> {
    return this.execute(new RequestBuilder("pin/add", {}, args));
  }

  public async namePublish(arg?: string): Promise<TNamePublish> {
    const path =
      typeof arg === "undefined"
        ? `/ipfs/${(await this.filesStat({ arg: "/" })).Hash}`
        : arg;
    return this.execute(new RequestBuilder("name/publish", {}, { arg: path }));
  }

  public async nameResolve(arg: string): Promise<TNameResolve> {
    return this.execute(new RequestBuilder("name/resolve", {}, { arg }));
  }

  public async keyList() {
    return (await this.execute<TNameKeyList>(new RequestBuilder("key/list")))
      .Keys;
  }

  public async execute<T>(
    requestBuilder: RequestBuilder,
    configHeaders: any = {}
  ): Promise<T> {
    const headers = {
      ...{ "Content-Type": "application/json" },
      ...configHeaders,
    };
    const res = await axios.post(
      this.getUrl(requestBuilder.command),
      requestBuilder.options,
      {
        params: requestBuilder.args,
        headers,
      }
    );
    return res.data;
  }
}
