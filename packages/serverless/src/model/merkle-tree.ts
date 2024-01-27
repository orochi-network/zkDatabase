import { Field, Poseidon } from 'o1js';
import { ObjectId } from 'mongodb';
import ModelGeneral from './general';
import ModelMerkleTreePool from './merkle-tree-pool';
import { ModelMerkleTreeMetadata } from './merkle-tree-metadata';
import logger from '../helper/logger';
import createExtendedMerkleWitness from '../helper/extended-merkle-witness';
import SmartContractService from '../service/SmartContractService';
import { ZKDATABASE_MERKLE_TREE_COLLECTION } from './abstract/database-engine';

export const DEFAULT_HEIGHT = 12;

export interface MerkleProof {
  sibling: Field;
  isLeft: boolean;
}

export class ModelMerkleTree extends ModelGeneral {
  private modelMerkleTreePool: ModelMerkleTreePool;

  private modelMerkleTreeMetadata: ModelMerkleTreeMetadata;

  private smartContractService: SmartContractService;

  private zeroes: Field[];

  private height: number;

  private constructor(
    databaseName: string,
    height: number,
    modelMerkleTreePool: ModelMerkleTreePool,
    modelMerkleTreeMetadata: ModelMerkleTreeMetadata,
    smartContractService: SmartContractService
  ) {
    super(databaseName, ZKDATABASE_MERKLE_TREE_COLLECTION, {
      timeseries: {
        timeField: 'timestamp',
        granularity: 'seconds',
      },
    });
    this.modelMerkleTreePool = modelMerkleTreePool;
    this.modelMerkleTreeMetadata = modelMerkleTreeMetadata;
    this.smartContractService = smartContractService;
    this.height = height;

    const zeroes = [Field(0)];
    for (let i = 1; i < height; i += 1) {
      zeroes.push(Poseidon.hash([zeroes[i - 1], zeroes[i - 1]]));
    }
    this.zeroes = zeroes;
  }

  public static async getInstance(
    databaseName: string,
    height: number = DEFAULT_HEIGHT
  ) {
    const modelMerkleTreePool = ModelMerkleTreePool.getInstance(databaseName);
    const modelMerkleTreeMetadata =
      ModelMerkleTreeMetadata.getInstance(databaseName);

    const smartContractService = SmartContractService.getInstance();

    const merkleTreeModel = new ModelMerkleTree(
      databaseName,
      height,
      modelMerkleTreePool,
      modelMerkleTreeMetadata,
      smartContractService
    );

    if (!(await merkleTreeModel.isCreated())) {
      await merkleTreeModel.createMetadata(height);
    }

    return merkleTreeModel;
  }

  public async isCreated(): Promise<Boolean> {
    return this.modelMerkleTreeMetadata.doesMetadataExist();
  }

  private async createMetadata(height: number) {
    this.modelMerkleTreeMetadata.create(
      height,
      await this.getNode(this.height - 1, 0n)
    );
  }

  public async getRoot(): Promise<string | undefined> {
    return (await this.modelMerkleTreeMetadata.getMetadata())?.root;
  }

  public async build(amount: number) {
    const leaves = await this.modelMerkleTreePool.getLatestLeaves(amount);
    const buildTime = new Date();

    const leafPromises = leaves.map((leaf) =>
      this.setLeaf(leaf.index, leaf.hash, buildTime)
    );
    await Promise.all(leafPromises);
  }

  private async setLeaf(
    index: bigint,
    leaf: Field,
    timestamp: Date
  ): Promise<void> {
    const witnesses = await this.getWitness(index);
    const ExtendedWitnessClass = createExtendedMerkleWitness(this.height);
    const extendedWitness = new ExtendedWitnessClass(witnesses);
    const path: Field[] = extendedWitness.calculatePath(leaf);

    let currIndex = index;
    const inserts = [];

    for (let level = 1; level < this.height; level += 1) {
      currIndex /= 2n;

      const dataToInsert = {
        _id: new ObjectId(
          ModelMerkleTree.encodeLevelAndIndexToObjectId(level, currIndex)
        ),
        timestamp,
        hash: path[level].toString(),
        level,
        index: currIndex,
      };

      inserts.push(dataToInsert);
    }

    await this.insertManyLeaves(inserts);
  }

  public async insertManyLeaves(leaves: Array<any>): Promise<void> {
    await this.collection.insertMany(leaves);
  }

  public async addLeafToPool(index: bigint, hash: string): Promise<Boolean> {
    return this.modelMerkleTreePool.saveLeaf(index, Field.from(hash));
  }

  public async getWitness(index: bigint): Promise<MerkleProof[]> {
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }

    let currIndex = index;

    const witnessPromises: Promise<MerkleProof>[] = [];
    for (let level = 0; level < this.height - 1; level += 1) {
      const isLeft = currIndex % 2n === 0n;
      const siblingIndex = isLeft ? currIndex + 1n : currIndex - 1n;

      witnessPromises.push(
        this.getNode(level, siblingIndex).then((sibling) => {
          return { isLeft, sibling };
        })
      );

      currIndex /= 2n;
    }

    return Promise.all(witnessPromises);
  }

  public async getNode(level: number, index: bigint): Promise<Field> {
    try {
      const id = new ObjectId(
        ModelMerkleTree.encodeLevelAndIndexToObjectId(level, index)
      );

      const node = (await this.findOne({ _id: id })) as any;

      return Field(node.hash) ?? this.zeroes[level];
    } catch (error) {
      logger.error('Error in getNodeOrZero:', error);
      throw error;
    }
  }

  private static encodeLevelAndIndexToObjectId(
    level: number,
    index: bigint
  ): string {
    return level.toString() + index.toString();
  }

  public get leafCount() {
    return 2n ** BigInt(this.height - 1);
  }
}

export default ModelMerkleTree;
