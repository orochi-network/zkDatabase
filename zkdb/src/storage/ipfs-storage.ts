import { CID } from 'multiformats';
import * as IPFS from 'ipfs-core';
import { PutOptions } from 'ipfs-core-types/src/dag';
import { Poseidon, Field } from 'snarkyjs';

export function convertHexToUint8Array(hexString: string): Uint8Array {
  const hex = hexString
    .replace(/^0x/i, '')
    .padStart(hexString.length + (hexString.length % 2), '0');
  const result = new Uint8Array(hex.length / 2);

  let j = 0;
  for (let i = 0; i < result.length; i += 1) {
    j = i * 2;
    result[i] = parseInt(hex.substring(j, j + 2), 16);
  }

  return result;
}

export interface IPFSStorageConfiguration {
  database: string;
}

export class IPFSStorage {
  private config: IPFSStorageConfiguration;

  private collections: any = {};

  private nodeInstance: IPFS.IPFS;

  constructor(
    IPFSNodeInstance: IPFS.IPFS,
    config?: Partial<IPFSStorageConfiguration>
  ) {
    this.config = { ...this.config, ...config };
    this.nodeInstance = IPFSNodeInstance;
  }

  private get databasePath(): string {
    return `/${this.config.database}`;
  }

  private get metadataPath(): string {
    return `${this.databasePath}/metadata.zkdb`;
  }

  private getCollectionPath(collection: string): string {
    return `${this.databasePath}/${collection}.json`;
  }

  private async poseidonHash(document: any): Promise<string> {
    const encoder = new TextEncoder();
    // Calculate poseidon hash of document
    const hexDigest = convertHexToUint8Array(
      Poseidon.hash([
        Field.fromBytes(
          (<any>encoder.encode(JSON.stringify(document))) as number[]
        ),
      ]).toString()
    );

    return (await this.nodeInstance.bases.getBase('base32')).encoder
      .encode(hexDigest)
      .toString();
  }

  private async isExist(path: string, filename: string) {
    for await (const file of this.nodeInstance.files.ls(path)) {
      if (file.name === filename) {
        return true;
      }
    }
    return false;
  }

  private async readFile(filename: string): Promise<Uint8Array> {
    let chunks = [];
    let length = 0;
    for await (const chunk of this.nodeInstance.files.read(filename)) {
      chunks.push(chunk);
      length += chunk.length;
    }
    let data = new Uint8Array(length);
    length = 0;
    for (let i = 0; i < chunks.length; i += 1) {
      data.set(chunks[i], length);
      length += chunks[i].length;
    }
    return data;
  }

  private async readJSON(filename: string): Promise<any> {
    let data = '';
    let decoder = new TextDecoder();

    for await (const chunk of this.nodeInstance.files.read(filename)) {
      data += decoder.decode(chunk);
    }
    return JSON.parse(data);
  }

  private async loadDatabase() {
    if (!(await this.isExist('/', this.config.database))) {
      await this.nodeInstance.files.mkdir(this.databasePath);
    }
  }

  private async loadCollection(collection: string) {
    if (!(await this.isExist(this.databasePath, `${collection}.json`))) {
      // Create metadata file for zkDatabase
      await this.nodeInstance.files.touch(this.getCollectionPath(collection));
      // Write {} to the file
      await this.nodeInstance.files.write(
        this.getCollectionPath(collection),
        new Uint8Array([123, 125])
      );
    }

    this.collections[collection] = await this.readJSON(
      this.getCollectionPath(collection)
    );
  }

  public static async init(
    config?: IPFSStorageConfiguration
  ): Promise<IPFSStorage> {
    const instance = new IPFSStorage(
      await IPFS.create({ peerStoreCacheSize: 10 }),
      config
    );
    await instance.loadDatabase();
    return instance;
  }

  public async put<T>(collection: string, document: T, option?: PutOptions) {
    await this.loadCollection(collection);
    let documentDigest = await this.poseidonHash(document);

    const result = await this.nodeInstance.dag.put(document, {
      pin: true,
      ...option,
    });
    const cid = result.toString();
    this.collections[collection][documentDigest] = cid;

    await this.nodeInstance.files.write(
      this.getCollectionPath(collection),
      JSON.stringify(this.collections[collection])
    );

    return {
      CID: cid,
      documentID: documentDigest,
      timestamp: Date.now(),
      database: this.config.database,
      collection,
      document,
    };
  }

  public async get(collection: string, documentID: string) {
    if (
      typeof this.collections[collection] === 'undefined' ||
      typeof this.collections[collection][documentID] === 'undefined'
    ) {
      await this.loadCollection(collection);
    }

    if (
      typeof this.collections[collection] !== 'undefined' &&
      typeof this.collections[collection][documentID] !== 'undefined'
    ) {
      const cid = CID.parse(this.collections[collection][documentID]);
      const DAGResult = await this.nodeInstance.dag.get(cid);
      return {
        CID: cid.toString(),
        documentID: documentID,
        ...DAGResult,
      };
    }
    return undefined;
  }
}
