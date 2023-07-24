import { Field } from 'snarkyjs';
import { FILENAME_MERKLE } from '../storage-engine/metadata.js';
import { BaseMerkleTree, TMerkleNodesMap } from './merkle-tree-base.js';
import { StorageEngine } from '../storage-engine/index.js';

export const MERKLE_TREE_COLLECTION_NAME = '.security';

export const MERKLE_TREE_FILE_NAME = 'merkle_tree';

export default class MerkleTreeStorage extends BaseMerkleTree {
  private storageEngine: StorageEngine;

  /**
   * Constructor method of MerkleTreeStorage
   * @param storageEngine
   * @param height
   * @param nodesMap
   */
  constructor(
    storageEngine: StorageEngine,
    height: number,
    nodesMap: TMerkleNodesMap = {}
  ) {
    super(height, nodesMap);
    this.storageEngine = storageEngine;
  }

  /**
   * Load MerkleTreeStorage from storageEngine
   * @param storageEngine
   * @param defaultHeight
   * @returns
   */
  public static async load(
    storageEngine: StorageEngine,
    defaultHeight: number
  ): Promise<MerkleTreeStorage> {
    if (await storageEngine.isFile(FILENAME_MERKLE)) {
      const [height, nodesMap] = MerkleTreeStorage.deserialize(
        await storageEngine.readFile(FILENAME_MERKLE)
      );
      return new MerkleTreeStorage(storageEngine, height, nodesMap);
    } else {
      return new MerkleTreeStorage(storageEngine, defaultHeight, {});
    }
  }

  /**
   * Save MerkleTreeStorage to storageEngine
   */
  public async save(): Promise<void> {
    this.storageEngine.writeMetadataFile(
      FILENAME_MERKLE,
      MerkleTreeStorage.serialize(await this.getNodes())
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
    const result = await this.storageEngine.isFile(FILENAME_MERKLE);
    return !result;
  }

  protected async writeLeaf(nodesMap: TMerkleNodesMap): Promise<void> {
    const currentNodesMap = await this.getNodes();
    console.log(
      Object.keys(currentNodesMap).length,
      Object.keys(nodesMap).length
    );
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
    await this.storageEngine.writeMetadataFile(
      FILENAME_MERKLE,
      BaseMerkleTree.serialize(nodes)
    );
  }

  protected async fetchNodes(): Promise<TMerkleNodesMap> {
    if (await this.isEmpty()) {
      return {};
    }

    const nodeBytes = await this.storageEngine.readFile(FILENAME_MERKLE);
    return BaseMerkleTree.deserialize(nodeBytes)[1];
  }

  protected async calculateMerklePath(_: bigint): Promise<TMerkleNodesMap> {
    return this.getNodes();
  }
}
