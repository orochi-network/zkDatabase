import { MerkleTree, Field } from 'o1js';
import { FILENAME_MERKLE, StorageEngine } from '../storage-engine/metadata.js';
import { MerkleProof } from './common.js';
import { MerkleTreeReadStream } from './merkle-tree-stream.js';
import { MerkleTreeWriteStream } from './merkle-tree-stream.js';

export const MERKLE_TREE_COLLECTION_NAME = '.security';

export const MERKLE_TREE_FILE_NAME = 'merkle_tree.txt';

// We record index/value
export type TMerkleNodesStorage = [bigint, Field][];

export class MerkleTreeStorage {
  private storageEngine: StorageEngine;
  private merkleTree: MerkleTree;
  private merkleNodes: Map<bigint, Field>;

  private constructor(
    storageEngine: StorageEngine,
    height: number,
    nodes: TMerkleNodesStorage = []
  ) {
    this.storageEngine = storageEngine;
    this.merkleTree = new MerkleTree(height);
    this.merkleNodes = new Map(nodes);
    this.setLeaves(nodes);
  }

  public static async load(
    storageEngine: StorageEngine,
    defaultHeight: number
  ): Promise<MerkleTreeStorage> {
    if (await storageEngine.isFile(FILENAME_MERKLE)) {
      const readStream = storageEngine.createReadStream(FILENAME_MERKLE);

      const merkleTreeWriteStream = new MerkleTreeWriteStream();

      await new Promise((resolve, reject) => {
        readStream
          .pipe(merkleTreeWriteStream)
          .on('finish', resolve)
          .on('error', reject);
      });

      const merkleData = merkleTreeWriteStream.getMerkleTreeData();
      return new MerkleTreeStorage(
        storageEngine,
        defaultHeight,
        merkleData.nodes
      );
    } else {
      return new MerkleTreeStorage(storageEngine, defaultHeight);
    }
  }

  public async save(): Promise<void> {
    return new Promise((resolve, reject) => {
      const merkleTreeStream = new MerkleTreeReadStream({
        height: this.merkleTree.height,
        nodes: Array.from(this.merkleNodes.entries()),
      });

      const writeStream = this.storageEngine.createWriteStream(FILENAME_MERKLE);
      merkleTreeStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      merkleTreeStream.pipe(writeStream);
    });
  }

  public getRoot(): Field {
    return this.merkleTree.getRoot();
  }

  public getWitness(index: bigint): MerkleProof[] {
    return this.merkleTree.getWitness(index);
  }

  public setLeaf(index: bigint, digest: Field) {
    this.merkleNodes.set(index, digest);
    this.merkleTree.setLeaf(index, digest);
  }

  public setLeaves(leaf: [index: bigint, digest: Field][]) {
    leaf.forEach((e) => this.setLeaf(e[0], e[1]));
  }

  public getLeafCount() {
    return this.merkleTree.leafCount;
  }
}
