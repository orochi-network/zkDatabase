import { StorageEngineIPFS } from '../storage-engine/ipfs.js';
import { Metadata } from '../storage-engine/metadata.js';
import { IDocument } from './common.js';
import loader from './loader.js';
export * from './common.js';

export class ZKDatabaseStorage {
  private metadata: Metadata;
  private storageEngine: StorageEngineIPFS;
  private collection: string;

  constructor(storageEngine: StorageEngineIPFS, metadata: Metadata) {
    this.storageEngine = storageEngine;
    this.metadata = metadata;
    this.collection = 'default';
  }

  public static async getInstance(merkleHeight: number = 64) {
    const storageEngine = await loader.getStorageEngine();
    const metadata = await loader.getMetadata(merkleHeight);
    return new ZKDatabaseStorage(storageEngine, metadata);
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

  public async read(index: number): Promise<Uint8Array | undefined> {
    return this.storageEngine.readFile(`${this.collection}/${index}`);
  }

  public async update(index: number, document: IDocument) {
    const digest = document.hash();
    // Write file with the index as filename to ipfs
    await this.storageEngine.writeFile(
      `${this.collection}/${index.toString()}`,
      document.serialize()
    );
    await this.metadata.merkle.setLeaf(BigInt(index), digest);
    await this.metadata.save();
  }

  public async write(document: IDocument) {
    // Add a new record to indexer
    const [result] = this.metadata.indexer.add(document.index()).get();
    await this.update(result.index, document);
  }

  public async find(key: string, value: any) {
    const result = [];
    const findRecords = this.metadata.indexer.find(key, value).get();
    if (findRecords.length > 0) {
      for (let i = 0; i < findRecords.length; i += 1) {
        const record = findRecords[i];
        if (record.collection === this.collection) {
          result.push({
            key,
            value,
            index: record.index,
            data: await this.read(record.index),
          });
        }
      }
    }
    return [];
  }
}
