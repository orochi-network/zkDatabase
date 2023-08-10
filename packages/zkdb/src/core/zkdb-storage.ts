import { Field } from 'snarkyjs';
import { MerkleProof } from '../merkle-tree/common.js';
import { StorageEngine, Metadata } from '../storage-engine/index.js';
import { IDocument } from './common.js';
import loader from './loader.js';
import { IIndexing } from 'index/simple.js';

/**
 * Represents search results for multile records.
 *
 * ```ts
 * const searchResult = await zkdbStorage.search('username', 'John');
 * if (!searchResult.isEmpty()) {
 *   await searchResult.update({ username: 'John Doe' });
 * }
 * ```
 */
export class SearchResult {
  private zkDatabaseStorage: ZKDatabaseStorage;
  private records: IIndexing[];

  /**
   * Creates a new search result.
   * @param zkdbStorage - The ZKDatabaseStorage instance.
   * @param records - The indexing records.
   */
  constructor(zkdbStorage: ZKDatabaseStorage, records: IIndexing[]) {
    this.zkDatabaseStorage = zkdbStorage;
    this.records = records;
  }

  /**
   * Batch executes a processor function.
   * @param processor A processor function.
   * @returns Results of the processor function.
   */
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

  /**
   * Checks if the search result is empty.
   * @returns A boolean value indicating whether the search result is empty.
   */
  public isEmpty() {
    return this.records.length === 0;
  }

  /**
   * Gets the records in the search result.
   * @returns The records in the search result.
   */
  public get(): IIndexing[] {
    return this.records;
  }

  /**
   * Updates the records in the search result.
   */
  public async update(document: IDocument) {
    this.batchExecute(async (record: IIndexing) =>
      this.zkDatabaseStorage.updateByIndex(record.index, document)
    );
  }

  /**
   * Gets the witness in the search result.
   * @returns The witness in the search result.
   */
  public async witnesses() {
    return this.batchExecute(async (record: IIndexing) =>
      this.zkDatabaseStorage.getWitnessByIndex(BigInt(record.index))
    );
  }

  /**
   * Load the documents in the search result.
   * @param documentSchema Document schema.
   * @returns Instances of the document schema.
   */
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

  /**
   * Load the first document in the search result.
   * @param documentSchema Document schema.
   * @returns An instance of the document schema.
   */
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

/**
 * Simular to **SearchResult**, but only for one record.
 * ```ts
 * const searchResult = await zkdbStorage.searchOne('username', 'John');
 * if (!searchResult.isEmpty()) {
 *   await searchResult.update({ username: 'John Doe' });
 * }
 * ```
 */
export class SearchResultOne {
  private zkDatabaseStorage: ZKDatabaseStorage;
  private record: IIndexing | undefined;

  constructor(zkdbStorage: ZKDatabaseStorage, record: IIndexing | undefined) {
    this.zkDatabaseStorage = zkdbStorage;
    this.record = record;
  }

  /**
   * Checks if the search result is empty.
   * @returns Returns a boolean value indicating whether the search result is empty.
   */
  public isEmpty() {
    return typeof this.record === 'undefined';
  }

  /**
   * Gets the collection name.
   */
  get collection() {
    if (typeof this.record === 'undefined') {
      throw new Error('Record is undefined');
    }
    return this.record.collection;
  }

  /**
   * Gets the index of the record.
   */
  get index() {
    if (typeof this.record === 'undefined') {
      throw new Error('Record is undefined');
    }
    return this.record.index;
  }

  /**
   * Gets the key of the record.
   */
  get key() {
    if (typeof this.record === 'undefined') {
      throw new Error('Record is undefined');
    }
    return this.record.key;
  }

  /**
   * Gets the digest of the record.
   */
  get digest() {
    if (typeof this.record === 'undefined') {
      throw new Error('Record is undefined');
    }
    return this.record.digest;
  }

  /**
   * Updates the document in the search result.
   * @param document Updates the document in the search result.
   */
  public async update(document: IDocument) {
    await this.zkDatabaseStorage.updateByIndex(Number(this.index), document);
  }

  /**
   * Gets the witness of the search result.
   * @returns Witness of the search result.
   */
  public async witness() {
    return this.zkDatabaseStorage.getWitnessByIndex(BigInt(this.index));
  }

  /**
   * Loads the instance of document in the search result.
   * @param documentSchema Document schema.
   * @returns Document instance.
   */
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

/**
 * Represents a ZK Database storage.
 */
export class ZKDatabaseStorage {
  private metadata: Metadata;
  private storageEngine: StorageEngine;
  private collection: string;

  /**
   * Creates a new instance of ZK Database storage.
   * @param storageEngine Storage engine.
   * @param metadata Metadata instance.
   */
  constructor(storageEngine: StorageEngine, metadata: Metadata) {
    this.storageEngine = storageEngine;
    this.metadata = metadata;
    this.collection = 'default';
  }

  /**
   * Get an instance of ZK Database storage.
   * @param merkleHeight Merkle tree height, default is 64.
   * @param dataLocation Data location, default is './data'.
   * @param local Use local storage, default is true.
   * @returns
   */
  public static async getInstance(
    merkleHeight: number = 64,
    dataLocation: string = './data',
    _local: boolean = true
  ) {
    const storageEngine = await loader.getLocalStorageEngine(dataLocation);
    const metadata = await loader.getMetadata(storageEngine, merkleHeight);
    return new ZKDatabaseStorage(storageEngine, metadata);
  }

  /**
   * Get the merkle root of the database.
   * @returns The merkle root of the database.
   */
  public async getMerkleRoot(): Promise<Field> {
    return this.metadata.merkle.getRoot();
  }

  /**
   * Get the witness of the index.
   * @param index Document index.
   * @returns Merkle proof.
   */
  public async getWitnessByIndex(index: bigint): Promise<MerkleProof[]> {
    return this.metadata.merkle.getWitness(index);
  }

  /**
   * Switch to a collection.
   * @param collection Collection name.
   */
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

  /**
   * Read a document by index.
   * @param index Document index.
   * @returns Document data.
   */
  public async readByIndex(index: number): Promise<Uint8Array | undefined> {
    return this.storageEngine.readFile(`${this.collection}/${index}`);
  }

  /**
   * Update a document by index.
   * @param index Document index.
   * @param document Document instance.
   */
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

  /**
   * Add a new document to the current collection.
   * @param document Document instance.
   */
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

  /**
   * Find all documents by key and value.
   * @param key Searching key.
   * @param value Searching value.
   * @returns [[SearchResult]]
   */
  public find(key: string, value: any) {
    return new SearchResult(
      this,
      this.metadata.indexer
        .find(key, value)
        .get()
        .filter((record) => record.collection === this.collection)
    );
  }

  /**
   * Find one document by key and value.
   * @param key Searching key.
   * @param value Searching value.
   * @returns [[SearchResultOne]]
   */
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
