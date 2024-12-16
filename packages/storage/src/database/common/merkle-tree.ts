import {
  TMerkleJson,
  TMerkleNode,
  TMerkleNodeDetailJson,
  TMerkleProof,
  TMerkleRecod,
} from '@zkdb/common';
import { BulkWriteOptions, FindOptions, OptionalId } from 'mongodb';
import { Field, MerkleTree, Poseidon } from 'o1js';
import { zkDatabaseConstant } from '../../common/const.js';
import { getCurrentTime } from '../../helper/common.js';
import { DATABASE_ENGINE } from '../../helper/db-instance.js';
import createExtendedMerkleWitness from '../../helper/extended-merkle-witness.js';
import ModelGeneral from '../base/general.js';
import { ModelMetadataDatabase } from '../global/metadata-database.js';

export class ModelMerkleTree extends ModelGeneral<OptionalId<TMerkleRecod>> {
  private static instances = new Map<string, ModelMerkleTree>();

  private zeroes: Field[] = [];

  private _height: number = 0;

  private generateZeroNode(height: number) {
    const zeroes = [Field(0)];
    for (let i = 1; i < height; i += 1) {
      zeroes.push(Poseidon.hash([zeroes[i - 1], zeroes[i - 1]]));
    }

    this.zeroes = zeroes;
  }

  private constructor(databaseName: string, height: number) {
    super(
      databaseName,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.databaseCollection.merkleTree
    );
    this._height = height;
    this.generateZeroNode(this._height);
  }

  public static async getInstance(
    databaseName: string
  ): Promise<ModelMerkleTree> {
    if (!ModelMerkleTree.instances.has(databaseName)) {
      const modelDatabaseMetadata = ModelMetadataDatabase.getInstance();
      const metadataDatabase = await modelDatabaseMetadata.findOne({
        databaseName,
      });
      if (!metadataDatabase) {
        throw new Error(`Metadata of ${databaseName} has not been found.`);
      }
      ModelMerkleTree.instances.set(
        databaseName,
        new ModelMerkleTree(databaseName, metadataDatabase?.merkleHeight)
      );
    }
    return ModelMerkleTree.instances.get(databaseName)!;
  }

  public static getEmptyRoot(height: number): Field {
    return new MerkleTree(height).getRoot();
  }

  public getListZeroNode(): Field[] {
    return this.zeroes;
  }

  public async getRoot(updatedAt: Date, options?: FindOptions): Promise<Field> {
    const root = await this.getNode(this._height - 1, 0n, updatedAt, options);
    return Field(root);
  }

  public async setLeaf(
    index: bigint,
    leaf: Field,
    before: Date,
    options?: BulkWriteOptions
  ): Promise<Field> {
    const witnesses = await this.getMerkleProof(index, before, options);
    const ExtendedWitnessClass = createExtendedMerkleWitness(this._height);
    const extendedWitness = new ExtendedWitnessClass(witnesses);
    const path: Field[] = extendedWitness.calculatePath(leaf);

    let currIndex = BigInt(index);
    const inserts = [];

    for (let level = 0; level < this._height; level += 1) {
      const dataToInsert: OptionalId<TMerkleRecod> = {
        leaf: leaf.toString(),
        hash: path[level].toString(),
        level,
        index: currIndex,
        updatedAt: getCurrentTime(),
        createdAt: getCurrentTime(),
      };

      inserts.push(dataToInsert);
      currIndex /= 2n;
    }

    await this.collection.insertMany(
      inserts,
      typeof options !== 'undefined' ? { session: options.session } : undefined
    );

    return path[this.height - 1];
  }

  /**
   * Get merkle tree proof
   * @param index
   * @param before
   * @param options
   * @returns
   */
  public async getMerkleProof(
    index: bigint,
    before: Date,
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
        this.getNode(level, siblingIndex, before, options).then((sibling) => {
          return { isLeft, sibling };
        })
      );

      currIndex /= 2n;
    }

    return Promise.all(witnessPromises);
  }

  public async getMerkleProofPath(
    index: bigint,
    before: Date,
    options?: FindOptions
  ): Promise<TMerkleNodeDetailJson[]> {
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }

    let currIndex = BigInt(index);

    const witnessPath: TMerkleNodeDetailJson[] = [];

    for (let level = 0; level < this._height - 1; level += 1) {
      const isLeft = currIndex % 2n === 0n;
      const siblingIndex = isLeft ? currIndex + 1n : currIndex - 1n;

      witnessPath.push(
        await this.getNode(level, currIndex, before, options).then((node) => {
          return {
            hash: node.toString(),
            level,
            index: currIndex,
            witness: false,
            target: currIndex === index,
            empty: node.equals(this.zeroes[level]).toBoolean(),
          };
        })
      );

      witnessPath.push(
        await this.getNode(level, siblingIndex, before, options).then(
          (node) => {
            return {
              hash: node.toString(),
              level,
              index: siblingIndex,
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
      await this.getNode(this._height - 1, 0n, before, options).then((node) => {
        return {
          hash: node.toString(),
          level: this.height - 1,
          index: 0n,
          witness: false,
          target: false,
          empty: node.equals(this.zeroes[this._height - 1]).toBoolean(),
        };
      })
    );
    return witnessPath;
  }

  public async getNode(
    level: number,
    index: bigint,
    before: Date,
    options?: FindOptions
  ): Promise<Field> {
    const node = await this.collection
      .find(
        {
          $and: [
            { level },
            { index },
            {
              updatedAt: { $lte: before },
            },
          ],
        },
        options
      )
      .sort({ updatedAt: -1 }) // Gets the latest state at or before the specified updatedAt
      .limit(1)
      .toArray();

    if (node.length === 0) {
      return this.zeroes[level];
    }

    return Field(node[0].hash);
  }

  public async getListNodeByLevel(
    level: number,
    before: Date,
    options?: FindOptions
  ): Promise<TMerkleJson<TMerkleNode>[]> {
    const query = {
      level,
      updatedAt: { $lte: before },
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

    const latestNode = await this.collection
      .aggregate<TMerkleJson<TMerkleNode>>(pipeline)
      .toArray();

    return latestNode;
  }

  public async countLatestNodeByLevel(
    level: number,
    before: Date
  ): Promise<number> {
    const query = {
      level,
      updatedAt: { $lte: before },
    };

    const latestNodeAggregation = await this.collection
      .aggregate([
        { $match: query },
        { $sort: { index: 1, updatedAt: -1 } },
        {
          $group: {
            _id: '$index',
            latestTimestamp: { $first: '$updatedAt' },
          },
        },
        { $count: 'total' },
      ])
      .toArray();

    const totalLatestNode =
      latestNodeAggregation.length > 0 ? latestNodeAggregation[0].total : 0;

    return totalLatestNode;
  }

  public get height(): number {
    return this._height;
  }

  public get leafCount() {
    return 2n ** BigInt(this._height - 1);
  }
}

export default ModelMerkleTree;
