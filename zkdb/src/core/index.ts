import DistributedMerkleTree from '../merkle-tree/merkle-tree-ipfs.js';
import { StorageEngineIPFS } from '../storage-engine/ipfs.js';
import { SimpleIndexer } from '../index/simple.js';
export * from './common.js';

export interface IZKDatabseStorageConfig {
  indexer?: SimpleIndexer;
  commitment?: DistributedMerkleTree;
  storageEngine: StorageEngineIPFS;
  height?: number;
}

export class ZKDatabaseStorage {
  private indexer: SimpleIndexer;
  private commitment: DistributedMerkleTree;
  private storageEngine: StorageEngineIPFS;
  private collection: string = 'default';

  constructor(config: IZKDatabseStorageConfig) {
    this.indexer = config.indexer || new SimpleIndexer([]);
    this.storageEngine = config.storageEngine;
    this.commitment =
      config.commitment ||
      new DistributedMerkleTree(config.storageEngine, config.height || 64);
  }

  public use(collection: string): ZKDatabaseStorage {
    this.collection = collection;
    this.storageEngine.use(this.collection);
    this.indexer.use(this.collection);
    return this;
  }
  /*
  public store(record: IDocument, indexing?: { [key: keyof IDocument]: any }) {
    const digest = record.hash();
    if (typeof indexing !== 'undefined') {
      this.indexer.add(indexing);
    }
  }*/
}
