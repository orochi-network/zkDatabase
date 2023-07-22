import { Field } from 'snarkyjs';
import { FILENAME_MERKLE } from '../storage-engine/metadata.js';
import { BaseMerkleTree, TMerkleNodesMap } from './merkle-tree-base.js';
import { StorageEngineIPFS } from '../storage-engine/ipfs.js';

export const MERKLE_TREE_COLLECTION_NAME = '.security';

export const MERKLE_TREE_FILE_NAME = 'merkle_tree';

export default class DistributedMerkleTree extends BaseMerkleTree {
  private ipfs: StorageEngineIPFS;

  /**
   * Constructor method of DistributedMerkleTree
   * @param ipfs
   * @param height
   * @param nodesMap
   */
  constructor(
    ipfs: StorageEngineIPFS,
    height: number,
    nodesMap: TMerkleNodesMap = {}
  ) {
    super(height, nodesMap);
    this.ipfs = ipfs;
  }

  /**
   * Load DistributedMerkleTree from IPFS
   * @param ipfs
   * @param defaultHeight
   * @returns
   */
  public static async load(
    ipfs: StorageEngineIPFS,
    defaultHeight: number
  ): Promise<DistributedMerkleTree> {
    if (await ipfs.isFile(FILENAME_MERKLE)) {
      const [height, nodesMap] = DistributedMerkleTree.deserialize(
        await ipfs.readFile(FILENAME_MERKLE)
      );
      return new DistributedMerkleTree(ipfs, height, nodesMap);
    } else {
      return new DistributedMerkleTree(ipfs, defaultHeight, {});
    }
  }

  /**
   * Save DistributedMerkleTree to IPFS
   */
  public async save(): Promise<void> {
    this.ipfs.writeMetadataFile(
      FILENAME_MERKLE,
      DistributedMerkleTree.serialize(await this.getNodes())
    );
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
    return this.ipfs.isFile(FILENAME_MERKLE);
  }

  protected async writeLeaf(nodesMap: TMerkleNodesMap): Promise<void> {
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

  protected async writeNodes(nodes: TMerkleNodesMap): Promise<void> {
    await this.ipfs.writeMetadataFile(
      FILENAME_MERKLE,
      BaseMerkleTree.serialize(nodes)
    );
  }

  protected async fetchNodes(): Promise<TMerkleNodesMap> {
    if (await this.isEmpty()) {
      return {};
    }

    const nodeBytes = await this.ipfs.readFile(FILENAME_MERKLE);
    return BaseMerkleTree.deserialize(nodeBytes)[1];
  }

  protected async calculateMerklePath(_: bigint): Promise<TMerkleNodesMap> {
    return this.getNodes();
  }
}
