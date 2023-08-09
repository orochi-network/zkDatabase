import { BSON } from 'bson';
import { Field, Poseidon } from 'snarkyjs';
import { MerkleProof } from './common.js';
import { createExtendedMerkleWitness } from './merkle-tree-extended.js';

export type TMerkleNodesMap = {
  [level: number]: {
    [nodes: string]: Field;
  };
};

// We record level/index/value
export type TMerkleNodesStorage = [number, number, string][];

/**
 * The BaseMerkleTree class is an abstract class that serves as the base for different
 * Merkle tree implementations. It provides common methods for working with Merkle trees,
 * including filling the tree with leaves, setting a leaf at a specific index, getting the
 * Merkle path (witness) for a leaf, and retrieving the tree nodes.
 *
 * @abstract
 */
export abstract class BaseMerkleTree {
  // Tree height
  public readonly height: number;

  // Node mapping
  private nodesMap: TMerkleNodesMap;

  // Zeroes nodes
  protected zeroes: Field[];

  // Flag indicating whether the tree needs to be updated
  protected needsUpdate = false;

  /**
   * Creates a new BaseMerkleTree instance.
   *
   * @param height The height of the Merkle tree.
   */
  constructor(height: number, nodesMap: TMerkleNodesMap = {}) {
    if (height < 1) {
      throw new Error('Merkle tree height must be greater than 0');
    }
    this.height = height;
    this.nodesMap = nodesMap;
    this.zeroes = new Array(height);
    this.zeroes[0] = Field(0);
    for (let i = 1; i < height; i += 1) {
      this.zeroes[i] = Poseidon.hash([this.zeroes[i - 1], this.zeroes[i - 1]]);
    }
  }

  /**
   * Determines if the Merkle tree is empty.
   *
   * @abstract
   * @returns A boolean value indicating whether the tree is empty.
   */
  public abstract isEmpty(): Promise<boolean>;

  /**
   * Retrieves a node from the Merkle tree given its level and index.
   *
   * @param level The level of the node in the tree.
   * @param index The index of the node within the level.
   * @returns A promise that resolves to the node's Field value.
   */
  // eslint-disable-next-line no-unused-vars
  public abstract getNode(level: number, index: bigint): Promise<Field>;

  /**
   * Retrieves the root of the Merkle tree.
   *
   * @returns A promise that resolves to the root's Field value.
   */
  public abstract getRoot(): Promise<Field>;

  /**
   * Saves a leaf to the remote Merkle tree.
   *
   * @abstract
   * @param nodesMap An object containing the nodes to be added to the tree.
   */
  // eslint-disable-next-line no-unused-vars
  protected abstract writeLeaf(nodesMap: TMerkleNodesMap): Promise<void>;

  /**
   * Saves the nodes of the remote Merkle tree.
   *
   * @abstract
   * @param nodes An object containing the nodes to be saved.
   */
  // eslint-disable-next-line no-unused-vars
  protected abstract writeNodes(nodes: TMerkleNodesMap): Promise<void>;

  /**
   * Fetches the nodes of the Merkle tree.
   *
   * @abstract
   * @returns A promise that resolves to an object containing the nodes of the tree.
   */
  protected abstract fetchNodes(): Promise<TMerkleNodesMap>;

  /**
   * Retrieves the Merkle path for a leaf at the specified index.
   *
   * @abstract
   * @param leafIndex The index of the leaf.
   * @returns A promise that resolves to an object containing the Merkle path.
   */
  protected abstract calculateMerklePath(
    _leafIndex: bigint
  ): Promise<TMerkleNodesMap>;

  public async getNodes(): Promise<TMerkleNodesMap> {
    if (Object.keys(this.nodesMap).length === 0 || this.needsUpdate) {
      this.nodesMap = await this.fetchNodes();
      this.needsUpdate = false;
    }

    return this.nodesMap;
  }

  private async setLeafAtLevel(
    nodesMap: TMerkleNodesMap,
    index: bigint,
    leaf: Field
  ) {
    nodesMap[0][index.toString()] = leaf;

    let currIndex = BigInt(index);
    for (let level = 1; level < this.height; level++) {
      currIndex /= 2n;
      const left = await this.getNodeOrZero(
        level - 1,
        currIndex * 2n,
        nodesMap
      );
      const right = await this.getNodeOrZero(
        level - 1,
        currIndex * 2n + 1n,
        nodesMap
      );
      if (!nodesMap[level]) {
        nodesMap[level] = {};
      }
      nodesMap[level][currIndex.toString()] = Poseidon.hash([left, right]);
    }
  }

  /**
   * Fills the Merkle tree with the provided leaves.
   *
   * @param leaves An array of leaves to fill the tree with.
   */
  public async fill(leaves: Field[]): Promise<void> {
    this.nodesMap = {};
    this.nodesMap[0] = {};

    await Promise.all(
      leaves.map((leaf, index) =>
        this.setLeafAtLevel(this.nodesMap, BigInt(index), leaf)
      )
    );

    this.needsUpdate = true;
    await this.writeNodes(this.nodesMap);
  }

  /**
   * Sets a leaf in the Merkle tree at the specified index.
   *
   * @param index The index of the leaf to set.
   * @param leaf The new leaf value.
   */
  public async setLeaf(index: bigint, leaf: Field): Promise<void> {
    const nodesMap: TMerkleNodesMap = {};

    if (await this.isEmpty()) {
      nodesMap[0] = {};
      await this.setLeafAtLevel(nodesMap, index, leaf);
    } else {
      const witnesses = await this.getWitness(index);
      const extendedWitnessClass = createExtendedMerkleWitness(this.height);
      const extendedWitness = new extendedWitnessClass(witnesses);
      const path = extendedWitness.calculatePath(leaf);

      nodesMap[0] = {};
      nodesMap[0][index.toString()] = path[0];

      let currIndex = index;
      for (let level = 1; level < this.height; level++) {
        currIndex /= 2n;
        if (!nodesMap[level]) {
          nodesMap[level] = {};
        }
        nodesMap[level][currIndex.toString()] = path[level];
      }
    }

    this.needsUpdate = true;
    await this.writeLeaf(nodesMap);
  }

  /**
   * Retrieves the Merkle witness for a leaf at the specified index.
   *
   * @param index The index of the leaf.
   * @returns A promise that resolves to an array of Merkle proofs for the specified leaf.
   */
  public async getWitness(index: bigint): Promise<MerkleProof[]> {
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }

    const path = await this.calculateMerklePath(index);

    const witness: MerkleProof[] = [];
    for (let level = 0; level < this.height - 1; level++) {
      const isLeft = this.isLeftNode(index);
      const sibling = await this.getNodeOrZero(
        level,
        isLeft ? index + 1n : index - 1n,
        path
      );

      witness.push({ isLeft, sibling });
      index /= 2n;
    }
    return witness;
  }

  protected async getNodeOrZero(
    level: number,
    index: bigint,
    nodes: TMerkleNodesMap
  ): Promise<Field> {
    return nodes[level]?.[index.toString()] ?? this.zeroes[level];
  }

  protected isLeftNode(nodeIndex: bigint): boolean {
    return nodeIndex % 2n === 0n;
  }

  public get leafCount() {
    return 2n ** BigInt(this.height - 1);
  }

  /**
   * @todo In the future we can think about byte stream
   * we can deal with gigabytes of Merkle tree and use storage
   * as a swap. The Merkle tree can be stored on storage and memory
   * @returns
   */
  protected static serialize(nodesMap: TMerkleNodesMap): Uint8Array {
    let matrix: TMerkleNodesStorage = [];
    for (const level in nodesMap) {
      for (const nodeIndex in nodesMap[level]) {
        matrix.push([
          parseInt(level, 10),
          parseInt(nodeIndex, 10),
          nodesMap[level][nodeIndex].toString(),
        ]);
      }
    }
    return BSON.serialize({ root: matrix });
  }

  /**
   * @todo Deserialization can be done in a streaming way
   * @param data
   * @returns
   */
  protected static deserialize(
    data: Uint8Array
  ): readonly [number, TMerkleNodesMap] {
    const matrix = <TMerkleNodesStorage>BSON.deserialize(data).root;
    const nodesMap: TMerkleNodesMap = {};
    let height = 0;
    for (let recordIndex = 0; recordIndex < matrix.length; recordIndex += 1) {
      const [level, index, value] = matrix[recordIndex];
      if (typeof nodesMap[level] === 'undefined') {
        nodesMap[level] = {};
      }
      nodesMap[level][index] = Field(value);
      if (level > height) {
        height = level;
      }
    }
    return [++height, nodesMap];
  }
}
