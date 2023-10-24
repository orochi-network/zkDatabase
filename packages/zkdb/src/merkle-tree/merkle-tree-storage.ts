import { Field } from 'o1js';
import { FILENAME_MERKLE } from '../storage-engine/metadata.js';
import { BaseMerkleTree, TMerkleNodesMap, TMerkleNodesStorage } from './merkle-tree-base.js';
import { StorageEngine } from '../storage-engine/index.js';
import { MerkleTreeReadStream } from './merkle-tree-read-stream.js';
import * as fs from 'fs';

export const MERKLE_TREE_COLLECTION_NAME = '.security';

export const MERKLE_TREE_FILE_NAME = 'merkle_tree';

export class MerkleTreeStorage extends BaseMerkleTree {
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
      const readStream = storageEngine.createReadStream(FILENAME_MERKLE);

      const nodesMap: TMerkleNodesMap = {};

      let height = 0;

      for await (const chunk of readStream) {
        const node = MerkleTreeStorage.deserializeNode(chunk);
        nodesMap[node[0]][node[1]] = Field(node[2]);
        if (node[0] > height) {
          height = node[0];
        }
      }

      return new MerkleTreeStorage(storageEngine, height, nodesMap);
    } else {
      return new MerkleTreeStorage(storageEngine, defaultHeight, {});
    }
  }

  /**
   * Save MerkleTreeStorage to storageEngine
   */
  public async save(): Promise<void> {
    const nodesMap = await this.getNodes();

    let nodes: TMerkleNodesStorage = [];
    for (const level in nodesMap) {
      for (const nodeIndex in nodesMap[level]) {
        nodes.push([
          parseInt(level, 10),
          parseInt(nodeIndex, 10),
          nodesMap[level][nodeIndex].toString(),
        ]);
      }
    }

    const merkleTreeStream = new MerkleTreeReadStream(nodes);

    const writeStream = this.storageEngine.createWriteStream(MERKLE_TREE_FILE_NAME);

    merkleTreeStream.pipe(writeStream);
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

  protected async writeNodes(nodesMap: TMerkleNodesMap): Promise<void> {
    let nodes: TMerkleNodesStorage = [];
    for (const level in nodesMap) {
      for (const nodeIndex in nodesMap[level]) {
        nodes.push([
          parseInt(level, 10),
          parseInt(nodeIndex, 10),
          nodesMap[level][nodeIndex].toString(),
        ]);
      }
    }

    const merkleTreeStream = new MerkleTreeReadStream(nodes);

    const writeStream = this.storageEngine.createWriteStream(MERKLE_TREE_FILE_NAME);

    merkleTreeStream.pipe(writeStream);
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
