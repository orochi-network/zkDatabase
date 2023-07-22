import { SimpleIndexer } from '../index/simple.js';
import { StorageEngineIPFS } from './ipfs.js';
import DistributedMerkleTree from '../merkle-tree/merkle-tree-ipfs.js';

export const FILENAME_INDEX = 'index.bson';
export const FILENAME_MERKLE = 'merkle.bson';

export class Metadata {
  public indexer: SimpleIndexer;
  public merkle: DistributedMerkleTree;
  public ipfs: StorageEngineIPFS;

  constructor(
    ipfs: StorageEngineIPFS,
    indexer: SimpleIndexer,
    merkleTree: DistributedMerkleTree
  ) {
    this.ipfs = ipfs;
    this.indexer = indexer;
    this.merkle = merkleTree;
  }

  /**
   * Save metadata to IPFS
   */
  public async save() {
    await this.ipfs.writeFile(FILENAME_INDEX, this.indexer.toBSON());
    await this.merkle.save();
  }

  /**
   * Laden Metadata from IPFS
   * @param ipfs
   * @param defaultHeight
   * @returns
   */
  public static async load(
    ipfs: StorageEngineIPFS,
    defaultHeight: number = 64
  ) {
    if (await ipfs.isExist()) {
      // Load indexer
      const indexer = (await ipfs.isFile(FILENAME_INDEX))
        ? SimpleIndexer.fromBSON(await ipfs.readFile(FILENAME_INDEX))
        : new SimpleIndexer([]);

      // Load merkle tree
      const merkleTree = await DistributedMerkleTree.load(ipfs, defaultHeight);

      // Return instance of Metadata
      return new Metadata(ipfs, indexer, merkleTree);
    }

    throw new Error(
      'Broken IPFS Storage Engine, root folder not found or data corrupted'
    );
  }
}
