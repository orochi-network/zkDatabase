import { Field, MerkleTree, Poseidon } from 'o1js';
import { ObjectId } from 'mongodb';
import ModelGeneral from './general';
import ModelMerkleTreePool from './merkle-tree-pool';
import { ModelMerkleTreeMetadata } from './merkle-tree-metadata';
import logger from '../helper/logger';
import createExtendedMerkleWitness from '../helper/extended-merkle-witness';

export interface MerkleProof {
  sibling: Field;
  isLeft: boolean;
}

export class ModelMerkleTree extends ModelGeneral {
  private modelMerkleTreePool: ModelMerkleTreePool;

  private modelMerkleTreeMetadata: ModelMerkleTreeMetadata;

  private zeroes: Field[];

  private height: number;

  private constructor(
    databaseName: string,
    height: number,
    modelMerkleTreePool: ModelMerkleTreePool,
    modelMerkleTreeMetadata: ModelMerkleTreeMetadata
  ) {
    super(databaseName, 'merkle-tree');
    this.modelMerkleTreePool = modelMerkleTreePool;
    this.modelMerkleTreeMetadata = modelMerkleTreeMetadata;
    this.height = height;

    const zeroes = [Field(0)];
    for (let i = 1; i < height; i += 1) {
      zeroes.push(Poseidon.hash([zeroes[i - 1], zeroes[i - 1]]));
    }
    this.zeroes = zeroes;
  }

  public static async getInstance(databaseName: string, height: number) {
    const modelMerkleTreePool = ModelMerkleTreePool.getInstance(databaseName);
    const modelMerkleTreeMetadata =
      ModelMerkleTreeMetadata.getInstance(databaseName);

    const merkleTreeModel = new ModelMerkleTree(
      databaseName,
      height,
      modelMerkleTreePool,
      modelMerkleTreeMetadata
    );

    if (!(await merkleTreeModel.isCreated())) {
      await merkleTreeModel.create(height);
    }

    return merkleTreeModel;
  }

  public async isCreated(): Promise<Boolean> {
    return this.modelMerkleTreeMetadata.doesMetadataExist();
  }

  private async create(height: number) {
    this.modelMerkleTreeMetadata.create(height, '');
  }

  public async getRoot(): Promise<string | undefined> {
    return (await this.modelMerkleTreeMetadata.getMetadata())?.root;
  }

  public async setLeaf(index: bigint, leaf: Field): Promise<void> {
    const witnesses = await this.getWitness(index);
    const ExtendedWitnessClass = createExtendedMerkleWitness(this.height);
    const extendedWitness = new ExtendedWitnessClass(witnesses);
    const path: Field[] = extendedWitness.calculatePath(leaf);

    let currIndex = index;
    const updates = [];

    for (let level = 1; level < this.height; level += 1) {
      currIndex /= 2n;

      const query = {
        _id: new ObjectId(
          ModelMerkleTree.encodeLevelAndIndexToObjectId(level, currIndex)
        ),
      };
      const update = { $set: { hash: path[level].toString() } };
      updates.push({ query, update });
    }

    await this.updateManyLeaves(updates);
  }

  public async updateManyLeaves(
    updates: Array<{ query: any; update: any }>
  ): Promise<void> {
    const bulkOperations = updates.map((update) => ({
      updateOne: {
        filter: update.query,
        update: update.update,
        upsert: true,
      },
    }));

    await this.collection.bulkWrite(bulkOperations);
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
        this.getNodeOrZero(level, siblingIndex).then((sibling) => {
          return { isLeft, sibling };
        })
      );

      currIndex /= 2n;
    }

    return Promise.all(witnessPromises);
  }

  protected async getNodeOrZero(level: number, index: bigint): Promise<Field> {
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
