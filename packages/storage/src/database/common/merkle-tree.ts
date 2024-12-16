import {
  TMerkleJson,
  TMerkleNode,
  TMerkleNodeRecord,
  TMerkleProof,
  TMerkleWitnessNode,
} from '@zkdb/common';
import crypto from 'crypto';
import { BulkWriteOptions, FindOptions, ObjectId, WithoutId } from 'mongodb';
import { Field, MerkleTree, Poseidon } from 'o1js';
import { zkDatabaseConstant } from '../../common/const.js';
import { DATABASE_ENGINE } from '../../helper/db-instance.js';
import createExtendedMerkleWitness from '../../helper/extended-merkle-witness.js';
import logger from '../../helper/logger.js';
import ModelGeneral from '../base/general.js';
import { ModelMetadataDatabase } from '../global/metadata-database.js';

export class ModelMerkleTree extends ModelGeneral<
  WithoutId<TMerkleNodeRecord>
> {
  private static instances = new Map<string, ModelMerkleTree>();

  private zeroes: Field[] = [];

  private _height: number = 0;

  private constructor(databaseName: string) {
    super(
      databaseName,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.databaseCollection.merkleTree,
      // @NOTE: Do we need this code
      {
        timeseries: {
          timeField: 'updatedAt',
          granularity: 'seconds',
        },
      }
    );
  }

  private static getInstance(databaseName: string): ModelMerkleTree {
    if (!ModelMerkleTree.instances.has(databaseName)) {
      ModelMerkleTree.instances.set(
        databaseName,
        new ModelMerkleTree(databaseName)
      );
    }
    return ModelMerkleTree.instances.get(databaseName)!;
  }

  public static async load(databaseName: string): Promise<ModelMerkleTree> {
    const modelMerkleTree = ModelMerkleTree.getInstance(databaseName);
    const modelDatabaseMetadata = ModelMetadataDatabase.getInstance();

    const database = await modelDatabaseMetadata.findOne({ databaseName });

    if (database) {
      modelMerkleTree.setHeight(database.merkleHeight);
      return modelMerkleTree;
    }

    throw Error(`Database: ${databaseName} has not been found.`);
  }

  public static getEmptyRoot(height: number): Field {
    return new MerkleTree(height).getRoot();
  }

  private setHeight(newHeight: number): void {
    if (this._height) {
      return;
    }
    this._height = newHeight;
    this.generateZeroNodes(newHeight);
  }

  public generateZeroNodes(height: number) {
    const zeroes = [Field(0)];
    for (let i = 1; i < height; i += 1) {
      zeroes.push(Poseidon.hash([zeroes[i - 1], zeroes[i - 1]]));
    }

    this.zeroes = zeroes;
  }

  public getZeroNodes(): Field[] {
    return this.zeroes;
  }

  public async getRoot(updatedAt: Date, options?: FindOptions): Promise<Field> {
    const root = await this.getNode(this._height - 1, 0n, updatedAt, options);
    return Field(root);
  }

  public async setLeaf(
    index: bigint,
    leaf: Field,
    updatedAt: Date,
    options?: FindOptions
  ): Promise<Field> {
    const witnesses = await this.getWitness(index, updatedAt, options);
    const ExtendedWitnessClass = createExtendedMerkleWitness(this._height);
    const extendedWitness = new ExtendedWitnessClass(witnesses);
    const path: Field[] = extendedWitness.calculatePath(leaf);

    let currIndex = BigInt(index);
    const inserts = [];

    for (let level = 0; level < this._height; level += 1) {
      const dataToInsert = {
        nodeId: ModelMerkleTree.encodeLevelAndIndexToObjectId(level, currIndex),
        updatedAt,
        hash: path[level].toString(),
        level,
        index: currIndex,
      };

      inserts.push(dataToInsert);
      currIndex /= 2n;
    }

    await this.insertManyLeaves(
      inserts,
      typeof options !== 'undefined' ? { session: options.session } : undefined
    );

    return path[this.height - 1];
  }

  public async insertManyLeaves(
    leaves: Array<any>,
    options?: BulkWriteOptions
  ): Promise<void> {
    await this.collection.insertMany(leaves, options);
  }

  public async getWitness(
    index: bigint,
    updatedAt: Date,
    options?: FindOptions
  ): Promise<TMerkleProof[]> {
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }

    let currIndex = BigInt(index);

    const witnessPromises: Promise<TMerkleProof>[] = [];
    for (let level = 0; level < this._height - 1; level += 1) {
      const isLeft = currIndex % 2n === 0n;
      const siblingIndex = isLeft ? currIndex + 1n : currIndex - 1n;

      witnessPromises.push(
        this.getNode(level, siblingIndex, updatedAt, options).then(
          (sibling) => {
            return { isLeft, sibling };
          }
        )
      );

      currIndex /= 2n;
    }

    return Promise.all(witnessPromises);
  }

  public async getWitnessPath(
    index: bigint,
    updatedAt: Date,
    options?: FindOptions
  ): Promise<TMerkleJson<TMerkleWitnessNode>[]> {
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }

    let currIndex = BigInt(index);

    const witnessPath: TMerkleJson<TMerkleWitnessNode>[] = [];

    for (let level = 0; level < this._height - 1; level += 1) {
      const isLeft = currIndex % 2n === 0n;
      const siblingIndex = isLeft ? currIndex + 1n : currIndex - 1n;

      witnessPath.push(
        await this.getNode(level, currIndex, updatedAt, options).then(
          (node) => {
            return {
              hash: node.toString(),
              level,
              index: Number(currIndex),
              witness: false,
              target: currIndex === index,
              empty: node.equals(this.zeroes[level]).toBoolean(),
            };
          }
        )
      );

      witnessPath.push(
        await this.getNode(level, siblingIndex, updatedAt, options).then(
          (node) => {
            return {
              hash: node.toString(),
              level,
              index: Number(siblingIndex),
              witness: true,
              target: false,
              empty: node.equals(this.zeroes[level]).toBoolean(),
            };
          }
        )
      );

      currIndex /= 2n;
    }

    witnessPath.push(
      await this.getNode(this._height - 1, 0n, updatedAt, options).then(
        (node) => {
          return {
            hash: node.toString(),
            level: this.height - 1,
            index: Number(0n),
            witness: false,
            target: false,
            empty: node.equals(this.zeroes[this._height - 1]).toBoolean(),
          };
        }
      )
    );
    return witnessPath;
  }

  public async getNode(
    level: number,
    index: bigint,
    updatedAt: Date,
    options?: FindOptions
  ): Promise<Field> {
    try {
      const nodeId = ModelMerkleTree.encodeLevelAndIndexToObjectId(
        level,
        index
      );

      const query = {
        nodeId,
        updatedAt: { $lte: updatedAt },
      };

      const node = await this.collection
        .find(query, options)
        .sort({ updatedAt: -1 }) // Gets the latest state at or before the specified updatedAt
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

  public async getNodesByLevel(
    level: number,
    updatedAt: Date,
    options?: FindOptions
  ): Promise<TMerkleJson<TMerkleNode>[]> {
    const query = {
      level,
      updatedAt: { $lte: updatedAt },
    };

    const pipeline: any[] = [
      { $match: query },
      { $sort: { index: 1, updatedAt: -1 } },
      {
        $group: {
          _id: '$index',
          node: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$node' } },
      { $sort: { index: 1 } },
    ];

    if (options?.projection) {
      pipeline.push({ $project: options.projection });
    }

    if (options?.limit) {
      pipeline.push({ $limit: options.limit });
    }

    const latestNodes = await this.collection
      .aggregate<TMerkleJson<TMerkleNode>>(pipeline)
      .toArray();

    return latestNodes;
  }

  public async countLatestNodesByLevel(
    level: number,
    updatedAt: Date
  ): Promise<number> {
    const query = {
      level,
      updatedAt: { $lte: updatedAt },
    };

    const latestNodesAggregation = await this.collection
      .aggregate([
        { $match: query },
        { $sort: { index: 1, updatedAt: -1 } },
        {
          $group: {
            _id: '$index',
            latestTimestamp: { $first: '$updatedAt' },
          },
        },
        { $count: 'totalLatestNodes' },
      ])
      .toArray();

    const totalLatestNodes =
      latestNodesAggregation.length > 0
        ? latestNodesAggregation[0].totalLatestNodes
        : 0;

    return totalLatestNodes;
  }

  private static encodeLevelAndIndexToObjectId(
    level: number,
    index: bigint
  ): ObjectId {
    const hash = crypto.createHash('md5');
    hash.update(`${level}:${index.toString()}`);
    return new ObjectId(hash.digest('hex').substring(0, 24));
  }

  public get height(): number {
    return this._height;
  }

  public get leafCount() {
    return 2n ** BigInt(this._height - 1);
  }
}

export default ModelMerkleTree;
