import { BaseMerkleTree, MerkleNodesMap } from './BaseMerkleTree.js';
import { StorageEngineIPFS } from '../../../storage-engine/ipfs.js';
import { BSON } from 'bson';
import { Field } from 'snarkyjs';

export const MERKLE_TREE_COLLECTION_NAME = '.security';

export const MERKLE_TREE_FILE_NAME = 'merkle_tree';

export default class DistributedMerkleTree extends BaseMerkleTree {
  private ipfs: StorageEngineIPFS;

  constructor(ipfs: StorageEngineIPFS, height: number) {
    super(height);
    this.ipfs = ipfs;
    ipfs.use(MERKLE_TREE_COLLECTION_NAME);
  }

  public async getRoot(): Promise<Field> {
    if (await this.isEmpty()) {
      return this.zeroes[this.height - 1];
    }
    const nodes = await this.getNodes();

    const value = nodes[this.height - 1]['0'];

    return Field(value);
  }

  public async getNode(level: number, index: bigint): Promise<Field> {
    if (await this.isEmpty()) {
      return this.zeroes[level];
    }

    const nodes = await this.getNodes();
    return this.getNodeOrZero(level, index, nodes);
  }

  public async isEmpty(): Promise<boolean> {
    return this.ipfs.isDocumentEmpty(MERKLE_TREE_FILE_NAME);
  }

  protected async writeLeaf(nodesMap: MerkleNodesMap): Promise<void> {
    const currentNodesMap = await this.getNodes();

    if (
      Object.keys(currentNodesMap).length !== Object.keys(nodesMap).length &&
      Object.keys(currentNodesMap).length !== 0
    ) {
      throw new Error(`the length of trees are not equal`);
    }

    for (const level in nodesMap) {
      const nodesAtLevel = nodesMap[level];

      for (const [nodeIndex, nodeValue] of Object.entries(nodesAtLevel)) {
        if (!currentNodesMap[level]) {
          currentNodesMap[level] = {};
        }
        currentNodesMap[level][nodeIndex] = nodeValue;
      }
    }

    await this.writeNodes(currentNodesMap);
  }

  protected async writeNodes(nodes: MerkleNodesMap): Promise<void> {
    this.ipfs.use(MERKLE_TREE_COLLECTION_NAME);
    await this.ipfs.writeMerkleBSON(nodes);
  }

  protected async fetchNodes(): Promise<MerkleNodesMap> {
    if (await this.isEmpty()) {
      return {};
    }

    const nodeBytes = await this.ipfs.readMerkleBSON();
    const bson = BSON.deserialize(nodeBytes);

    const nodesMap: MerkleNodesMap = bson as MerkleNodesMap;

    for (const level in nodesMap) {
      const levelNodes = nodesMap[level];
      for (const nodeIndex in levelNodes) {
        const nodeValue = levelNodes[nodeIndex];
        delete levelNodes[nodeIndex];
        levelNodes[nodeIndex] = Field(nodeValue);
      }
    }
    return nodesMap;
  }

  protected async calculateMerklePath(_: bigint): Promise<MerkleNodesMap> {
    return await this.getNodes();
  }
}
