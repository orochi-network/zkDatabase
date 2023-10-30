import { SimpleIndexer } from '../index/simple.js';
import { StorageEngineDelegatedIPFS } from './delegated-ipfs.js';
import { StorageEngineLocal } from './local.js';
import { StorageEngineIPFS } from './index.js';
import { MerkleTreeStorage } from '../merkle-tree/merkle-tree-storage.js';

export type StorageEngine =
  | StorageEngineLocal
  | StorageEngineDelegatedIPFS
  | StorageEngineIPFS;

export const FILENAME_INDEX = 'index.bson';
export const FILENAME_MERKLE = 'merkle-tree.txt';

export class Metadata {
  public indexer: SimpleIndexer;
  public merkle: MerkleTreeStorage;
  public storageEngine: StorageEngine;

  constructor(
    storageEngine: StorageEngine,
    indexer: SimpleIndexer,
    merkleTree: MerkleTreeStorage
  ) {
    this.storageEngine = storageEngine;
    this.indexer = indexer;
    this.merkle = merkleTree;
  }

  /**
   * Save metadata to IPFS
   */
  public async save() {
    await this.storageEngine.writeFile(FILENAME_INDEX, this.indexer.toBSON());
    await this.merkle.save();
  }

  /**
   * Laden Metadata from IPFS
   * @param ipfs
   * @param defaultHeight
   * @returns
   */
  public static async getInstance(
    storageEngine: StorageEngine,
    defaultHeight: number = 64
  ) {
    if (await storageEngine.isExist()) {
      // Load indexer
      const indexer = (await storageEngine.isFile(FILENAME_INDEX))
        ? SimpleIndexer.fromBSON(await storageEngine.readFile(FILENAME_INDEX))
        : new SimpleIndexer([]);

      // Load merkle tree
      const merkleTree = await MerkleTreeStorage.load(
        storageEngine,
        defaultHeight
      );

      // Return instance of Metadata
      return new Metadata(storageEngine, indexer, merkleTree);
    }

    throw new Error(
      'Broken IPFS Storage Engine, root folder not found or data corrupted'
    );
  }
}
