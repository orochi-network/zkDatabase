import DistributedMerkleTree from '../merkle-tree/merkle-tree-ipfs.js';
import { StorageEngineIPFS } from '../storage-engine/index.js';
import { SimpleIndexing } from '../index/index.js';
import { Field } from 'snarkyjs';

export interface IDocument {
  hash(): Field;
  index(): { [key: string]: string };
}

export interface IZKDatabseStorageConfig {
  indexer?: SimpleIndexing;
  commitment?: DistributedMerkleTree;
  storageEngine: StorageEngineIPFS;
  height?: number;
}

export class ZKDatabaseStorage {
  private indexer: SimpleIndexing;
  private commitment: DistributedMerkleTree;
  private storageEngine: StorageEngineIPFS;
  private collection: string = 'default';

  constructor(config: IZKDatabseStorageConfig) {
    this.indexer = config.indexer || new SimpleIndexing();
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
