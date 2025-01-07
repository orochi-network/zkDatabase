import { zkDatabaseConstant } from '@common';
import {
  DATABASE_ENGINE,
  createExtendedMerkleWitness,
  getCurrentTime,
} from '@helper';
import {
  TMerkleJson,
  TMerkleNode,
  TMerkleNodeDetailJson,
  TMerkleProof,
  TMerkleRecord,
} from '@zkdb/common';
import { ClientSession, FindOptions, OptionalId } from 'mongodb';
import { Field, MerkleTree, Poseidon } from 'o1js';
import { ModelGeneral } from '../base';
import { ModelMetadataDatabase } from '../global';

export class ModelMerkleTree extends ModelGeneral<OptionalId<TMerkleRecord>> {
  private static instances = new Map<string, ModelMerkleTree>();

  private zeroes: Field[] = [];

  private _height: number = 0;

  private generateZeroNode(height: number) {
    const zeroes = new Array<Field>(height);
    zeroes[0] = Field(0n);
    for (let i = 1; i < height; i += 1) {
      zeroes[i] = Poseidon.hash([zeroes[i - 1], zeroes[i - 1]]);
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

  public async getRoot(options?: FindOptions): Promise<Field> {
    const root = await this.getNode(this._height - 1, 0n, options);
    return Field(root);
  }

  public async setLeaf(
    index: bigint,
    leaf: Field,
    session: ClientSession
  ): Promise<Field> {
    const witnesses = await this.getMerkleProof(index, { session });
    const ExtendedWitnessClass = createExtendedMerkleWitness(this._height);
    const extendedWitness = new ExtendedWitnessClass(witnesses);
    const path: Field[] = extendedWitness.calculatePath(leaf);

    let currIndex = BigInt(index);
    const inserts = [];
    const removals = [];

    const currentTime = getCurrentTime();

    for (let level = 0; level < this._height; level += 1) {
      const dataToInsert: OptionalId<TMerkleRecord> = {
        leaf: leaf.toString(),
        hash: path[level].toString(),
        level,
        index: currIndex,
        updatedAt: currentTime,
        createdAt: currentTime,
      };

      // TODO: is upsert more efficient? how to do a batched upsert?
      inserts.push(dataToInsert);
      removals.push({ level, index: currIndex });

      currIndex /= 2n;
    }

    await this.collection.deleteMany(
      { $or: removals.map((r) => ({ level: r.level, index: r.index })) },
      { session }
    );
    await this.collection.insertMany(inserts, { session });

    return path[this.height - 1];
  }

  /**
   * Get merkle tree proof
   * @param index
   * @param options
   * @returns
   */
  public async getMerkleProof(
    index: bigint,
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
        this.getNode(level, siblingIndex, options).then((sibling) => {
          return { isLeft, sibling };
        })
      );

      currIndex /= 2n;
    }

    return Promise.all(witnessPromises);
  }

  public async getMerkleProofPath(
    index: bigint,
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
        await this.getNode(level, currIndex, options).then((node) => {
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
        await this.getNode(level, siblingIndex, options).then((node) => {
          return {
            hash: node.toString(),
            level,
            index: siblingIndex,
            witness: true,
            target: false,
            empty: node.equals(this.zeroes[level]).toBoolean(),
          };
        })
      );

      currIndex /= 2n;
    }

    witnessPath.push(
      await this.getNode(this._height - 1, 0n, options).then((node) => {
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
    options?: FindOptions
  ): Promise<Field> {
    const node = await this.collection
      .find({ level, index }, options)
      .limit(1)
      .toArray();

    if (node.length === 0) {
      return this.zeroes[level];
    }

    return Field(node[0].hash);
  }

  public async getListNodeByLevel(
    level: number,
    options?: FindOptions
  ): Promise<TMerkleJson<TMerkleNode>[]> {
    const pipeline: any[] = [
      { $match: { level } },
      {
        // TODO: is this group by necessary?
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

  public async countLatestNodeByLevel(level: number): Promise<number> {
    const latestNodeAggregation = await this.collection
      .aggregate([
        { $match: { level } },
        { $sort: { index: 1 } },
        {
          // TODO: is this group by necessary?
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
