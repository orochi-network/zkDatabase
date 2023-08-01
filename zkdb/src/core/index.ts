import { Field } from 'snarkyjs';
import { MerkleProof } from '../merkle-tree/common.js';
import { StorageEngine, Metadata } from '../storage-engine/index.js';
import { IDocument } from './common.js';
import loader from './loader.js';
import { IIndexing } from 'index/simple.js';
export * from './common.js';
export * from './loader.js';
export * from './schema.js';
export * from './smart-contract.js';
export * from '../utilities/binary.js';

export class SearchResult {
  private zkDatabaseStorage: ZKDatabaseStorage;
  private records: IIndexing[];

  constructor(zkdbStorage: ZKDatabaseStorage, records: IIndexing[]) {
    this.zkDatabaseStorage = zkdbStorage;
    this.records = records;
  }

  private async batchExecute<T>(
    processor: (_record: IIndexing, _index?: number) => Promise<T>
  ): Promise<T[]> {
    const results = [];
    for (let i = 0; i < this.records.length; i += 1) {
      if (typeof document !== 'undefined') {
        results.push(await processor(this.records[i], i));
      }
    }
    return results;
  }

  public isEmpty() {
    return this.records.length === 0;
  }

  public get(): IIndexing[] {
    return this.records;
  }

  public async update(document: IDocument) {
    this.batchExecute(async (record: IIndexing) =>
      this.zkDatabaseStorage.updateByIndex(record.index, document)
    );
  }

  public async witnesses() {
    return this.batchExecute(async (record: IIndexing) =>
      this.zkDatabaseStorage.getWitnessByIndex(BigInt(record.index))
    );
  }

  public async load<
    T extends {
      new (..._args: any): InstanceType<T>;
      decode: (_doc: Uint8Array) => any;
    }
  >(documentSchema: T): Promise<InstanceType<T>[]> {
    return this.batchExecute(
      async (record: IIndexing) =>
        new documentSchema(
          documentSchema.decode(
            (await this.zkDatabaseStorage.readByIndex(record.index))!
          )
        )
    );
  }

  public async loadOne<
    T extends {
      new (..._args: any): InstanceType<T>;
      decode: (_doc: Uint8Array) => any;
    }
  >(documentSchema: T): Promise<InstanceType<T> | undefined> {
    if (this.records.length > 0) {
      return new documentSchema(
        documentSchema.decode(
          (await this.zkDatabaseStorage.readByIndex(this.records[0].index))!
        )
      );
    }
    return undefined;
  }
}

export class SearchResultOne {
  private zkDatabaseStorage: ZKDatabaseStorage;
  private record: IIndexing | undefined;

  constructor(zkdbStorage: ZKDatabaseStorage, record: IIndexing | undefined) {
    this.zkDatabaseStorage = zkdbStorage;
    this.record = record;
  }

  public isEmpty() {
    return typeof this.record === 'undefined';
  }

  get collection() {
    if (typeof this.record === 'undefined') {
      throw new Error('Record is undefined');
    }
    return this.record.collection;
  }

  get index() {
    if (typeof this.record === 'undefined') {
      throw new Error('Record is undefined');
    }
    return this.record.index;
  }

  get key() {
    if (typeof this.record === 'undefined') {
      throw new Error('Record is undefined');
    }
    return this.record.key;
  }

  get digest() {
    if (typeof this.record === 'undefined') {
      throw new Error('Record is undefined');
    }
    return this.record.digest;
  }

  public async update(document: IDocument) {
    await this.zkDatabaseStorage.updateByIndex(Number(this.index), document);
  }

  public async witness() {
    return this.zkDatabaseStorage.getWitnessByIndex(BigInt(this.index));
  }

  public async load<
    T extends {
      new (..._args: any): InstanceType<T>;
      decode: (_doc: Uint8Array) => any;
    }
  >(documentSchema: T): Promise<InstanceType<T>> {
    return new documentSchema(
      documentSchema.decode(
        (await this.zkDatabaseStorage.readByIndex(this.index))!
      )
    );
  }
}

export class ZKDatabaseStorage {
  private metadata: Metadata;
  private storageEngine: StorageEngine;
  private collection: string;

  constructor(storageEngine: StorageEngine, metadata: Metadata) {
    this.storageEngine = storageEngine;
    this.metadata = metadata;
    this.collection = 'default';
  }

  public static async getInstance(
    merkleHeight: number = 64,
    dataLocation: string = './data',
    local: boolean = true
  ) {
    const storageEngine = local
      ? await loader.getLocalStorageEngine(dataLocation)
      : await loader.getIPFSStorageEngine(dataLocation);
    const metadata = await loader.getMetadata(storageEngine, merkleHeight);
    return new ZKDatabaseStorage(storageEngine, metadata);
  }

  public async getMerkleRoot(): Promise<Field> {
    return this.metadata.merkle.getRoot();
  }

  public async getWitnessByIndex(index: bigint): Promise<MerkleProof[]> {
    return this.metadata.merkle.getWitness(index);
  }

  public async use(collection: string) {
    const collectionState = await this.storageEngine.check(collection);
    // If collection does not exist, create it
    if (typeof collectionState === 'undefined') {
      await this.storageEngine.mkdir(collection);
    }
    if (await this.storageEngine.isFolder(collection)) {
      this.storageEngine.use(collection);
      this.metadata.indexer.use(collection);
      this.collection = collection;
    } else {
      throw new Error(`Collection ${collection} is not exist`);
    }
  }

  public async readByIndex(index: number): Promise<Uint8Array | undefined> {
    return this.storageEngine.readFile(`${this.collection}/${index}`);
  }

  public async updateByIndex(index: number, document: IDocument) {
    const digest = document.hash();
    // Write file with the index as filename to ipfs
    await this.storageEngine.writeFile(
      `${index.toString()}`,
      document.serialize()
    );
    await this.metadata.merkle.setLeaf(BigInt(index), digest);
    await this.metadata.save();
  }

  public async add(document: IDocument) {
    const entires = Object.entries(document.index());
    for (let i = 0; i < entires.length; i += 1) {
      const [key, value] = entires[i];
      if (this.metadata.indexer.find(key, value).get().length > 0) {
        throw new Error('Duplicate value of the index key');
      }
    }
    // Add a new record to indexer
    const [result] = this.metadata.indexer.add(document.index()).get();
    await this.updateByIndex(result.index, document);
  }

  public find(key: string, value: any) {
    return new SearchResult(
      this,
      this.metadata.indexer
        .find(key, value)
        .get()
        .filter((record) => record.collection === this.collection)
    );
  }

  public findOne(key: string, value: any) {
    const records = this.metadata.indexer
      .find(key, value)
      .get()
      .filter((record) => record.collection === this.collection);
    return new SearchResultOne(
      this,
      records.length > 0 ? records[0] : undefined
    );
  }
}
