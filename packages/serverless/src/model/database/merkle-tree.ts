import { Field, Poseidon } from 'o1js';
import crypto from 'crypto';
import { ObjectId, Document, FindOptions, BulkWriteOptions } from 'mongodb';
import ModelGeneral from '../abstract/general';
import logger from '../../helper/logger';
import createExtendedMerkleWitness from '../../helper/extended-merkle-witness';
import { ZKDATABASE_MERKLE_TREE_COLLECTION } from '../../common/const';

// Data type for merkle tree to be able to store in database
export interface MerkleProof extends Document {
  sibling: string;
  isLeft: boolean;
}

export type TMerkleProof = {
  sibling: Field;
  isLeft: boolean;
};

export class ModelMerkleTree extends ModelGeneral<MerkleProof> {
  private zeroes!: Field[];

  private height!: number;

  private constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_MERKLE_TREE_COLLECTION, {
      timeseries: {
        timeField: 'timestamp',
        granularity: 'seconds',
      },
    });
  }

  public setHeight(newHeight: number): void {
    this.height = newHeight;
    this.generateZeroNodes(newHeight);
  }

  public generateZeroNodes(height: number) {
    const zeroes = [Field(0)];
    for (let i = 1; i < height; i += 1) {
      zeroes.push(Poseidon.hash([zeroes[i - 1], zeroes[i - 1]]));
    }
    this.zeroes = zeroes;
  }

  public static getInstance(databaseName: string) {
    return new ModelMerkleTree(databaseName);
  }

  public async getRoot(timestamp: Date): Promise<Field> {
    const root = await this.getNode(this.height - 1, 0n, timestamp);
    return Field(root);
  }

  public async setLeaf(
    index: bigint,
    leaf: Field,
    timestamp: Date,
    options?: FindOptions
  ): Promise<void> {
    const witnesses = await this.getWitness(index, timestamp, options);
    const ExtendedWitnessClass = createExtendedMerkleWitness(this.height);
    const extendedWitness = new ExtendedWitnessClass(witnesses);
    const path: Field[] = extendedWitness.calculatePath(leaf);

    let currIndex = BigInt(index);
    const inserts = [];

    for (let level = 1; level < this.height; level += 1) {
      currIndex /= 2n;

      const dataToInsert = {
        nodeId: ModelMerkleTree.encodeLevelAndIndexToObjectId(level, currIndex),
        timestamp,
        hash: path[level].toString(),
        level,
        index: currIndex,
      };

      inserts.push(dataToInsert);
    }

    await this.insertManyLeaves(
      inserts,
      typeof options !== 'undefined' ? { session: options.session } : undefined
    );
  }

  public async insertManyLeaves(
    leaves: Array<any>,
    options?: BulkWriteOptions
  ): Promise<void> {
    await this.collection.insertMany(leaves, options);
  }

  public async getWitness(
    index: bigint,
    timestamp: Date,
    options?: FindOptions
  ): Promise<TMerkleProof[]> {
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }

    let currIndex = BigInt(index);

    const witnessPromises: Promise<TMerkleProof>[] = [];
    for (let level = 0; level < this.height - 1; level += 1) {
      const isLeft = currIndex % 2n === 0n;
      const siblingIndex = isLeft ? currIndex + 1n : currIndex - 1n;

      witnessPromises.push(
        this.getNode(level, siblingIndex, timestamp, options).then(
          (sibling) => {
            return { isLeft, sibling };
          }
        )
      );

      currIndex /= 2n;
    }

    return Promise.all(witnessPromises);
  }

  public async getNode(
    level: number,
    index: bigint,
    timestamp: Date,
    options?: FindOptions
  ): Promise<Field> {
    try {
      const nodeId = ModelMerkleTree.encodeLevelAndIndexToObjectId(
        level,
        index
      );

      const query = {
        nodeId,
        timestamp: { $lte: timestamp },
      };

      const node = await this.collection
        .find(query, options)
        .sort({ timestamp: -1 }) // Gets the latest state at or before the specified timestamp
        .limit(1)
        .toArray();

      if (node.length === 0) {
        return this.zeroes[level];
      }

      return Field(node[0].hash);
    } catch (error) {
      logger.error('Error in getNode:', error);
      throw error;
    }
  }

  private static encodeLevelAndIndexToObjectId(
    level: number,
    index: bigint
  ): ObjectId {
    const hash = crypto.createHash('md5');
    hash.update(level.toString() + index.toString());
    return new ObjectId(hash.digest('hex').substring(0, 24));
  }

  public get leafCount() {
    return 2n ** BigInt(this.height - 1);
  }
}

export default ModelMerkleTree;
