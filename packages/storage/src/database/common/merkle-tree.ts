/* eslint-disable no-await-in-loop */

import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE, createExtendedMerkleWitness } from '@helper';
import {
  TMerkleJson,
  TMerkleNode,
  TMerkleNodeDetailJson,
  TMerkleProofSerialized,
  TMerkleRecord,
  TPagination,
} from '@zkdb/common';
import { ClientSession, FindOptions, OptionalId } from 'mongodb';
import { Field, MerkleTree, Poseidon } from 'o1js';
import { ModelGeneral } from '../base';
import { ModelMetadataDatabase } from '../global';
import { ModelCollection } from '../general';

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
      zkDatabaseConstant.globalMerkleTreeDatabase,
      DATABASE_ENGINE.dbMina,
      databaseName
    );
    this._height = height;
    this.generateZeroNode(this._height);
  }

  /** Session is required to avoid concurrency issues such as write conflict
   * while initializing the collection (create index, etc.) and writing to the
   * collection at the same time. */
  public static async getInstance(
    databaseName: string,
    session: ClientSession
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
      await ModelMerkleTree.init(databaseName, session);
    }
    return ModelMerkleTree.instances.get(databaseName)!;
  }

  public static clearInstance(databaseName: string) {
    ModelMerkleTree.instances.delete(databaseName);
  }

  public static getEmptyRoot(height: number): Field {
    return new MerkleTree(height).getRoot();
  }

  public getListZeroNode(): Field[] {
    return this.zeroes;
  }

  public async getRoot(options?: FindOptions): Promise<string> {
    const root = await this.getNode(this._height - 1, 0n, options);
    return root;
  }

  public async setLeaf(
    index: bigint,
    leaf: Field,
    session: ClientSession
  ): Promise<string> {
    const witnesses = (await this.getMerkleProof(index, { session })).map(
      (w) => ({
        ...w,
        sibling: Field(w.sibling),
      })
    );
    const ExtendedWitnessClass = createExtendedMerkleWitness(this._height);
    const extendedWitness = new ExtendedWitnessClass(witnesses);
    const path: Field[] = extendedWitness.calculatePath(leaf);

    let currIndex = BigInt(index);
    const inserts = [];
    const removals = [];

    const currentTime = new Date();

    for (let level = 0; level < this._height; level += 1) {
      const dataToInsert: OptionalId<TMerkleRecord> = {
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

    return path[this.height - 1].toString();
  }

  /**
   * Get the merkle proof for a leaf at a given merkle index
   */
  public async getMerkleProof(
    index: bigint,
    options?: FindOptions
  ): Promise<TMerkleProofSerialized[]> {
    if (index >= this.leafCount) {
      throw new Error(
        `index ${index} is out of range for ${this.leafCount} leaves.`
      );
    }

    let currIndex = BigInt(index);

    const witness: TMerkleProofSerialized[] = [];
    for (let level = 0; level < this._height - 1; level += 1) {
      const isLeft = currIndex % 2n === 0n;
      const siblingIndex = isLeft ? currIndex + 1n : currIndex - 1n;

      witness.push(
        await this.getNode(level, siblingIndex, options).then((sibling) => {
          return { isLeft, sibling };
        })
      );

      currIndex /= 2n;
    }

    return witness;
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

      const node = await this.getNode(level, currIndex, options);
      witnessPath.push({
        hash: node.toString(),
        level,
        index: currIndex,
        witness: false,
        target: currIndex === index,
        empty: Field(node).equals(this.zeroes[level]).toBoolean(),
      });

      const sibling = await this.getNode(level, siblingIndex, options);
      witnessPath.push({
        hash: sibling.toString(),
        level,
        index: siblingIndex,
        witness: true,
        target: false,
        empty: Field(sibling).equals(this.zeroes[level]).toBoolean(),
      });

      currIndex /= 2n;
    }

    const root = await this.getNode(this._height - 1, 0n, options);
    witnessPath.push({
      hash: root.toString(),
      level: this.height - 1,
      index: 0n,
      witness: false,
      target: false,
      empty: Field(root)
        .equals(this.zeroes[this._height - 1])
        .toBoolean(),
    });

    return witnessPath;
  }

  /** Get a node content given its level and index */
  public async getNode(
    level: number,
    index: bigint,
    options?: FindOptions
  ): Promise<string> {
    const node = await this.collection.findOne({ level, index }, options);

    if (!node) {
      return this.zeroes[level].toString();
    }

    return node.hash;
  }

  /** Get all non-empty nodes at a given level */
  public async getListNodeByLevel(
    level: number,
    pagination: TPagination,
    session?: ClientSession
  ): Promise<TMerkleJson<TMerkleNode>[]> {
    const result = await this.collection
      .find({ level }, { session })
      .sort({ index: 1 })
      .limit(pagination.limit)
      .skip(pagination.offset)
      .toArray();

    return result.map((node) => ({
      hash: node.hash,
      level: node.level,
      index: node.index,
    }));
  }

  /** Count the number of non-empty nodes at a given level */
  public async countNodeByLevel(
    level: number,
    session?: ClientSession
  ): Promise<number> {
    return this.collection.countDocuments({ level }, { session });
  }

  public get height(): number {
    return this._height;
  }

  public get leafCount() {
    return 2n ** BigInt(this._height - 1);
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalMerkleTreeDatabase,
      DATABASE_ENGINE.dbMina,
      databaseName
    );
    if (!(await collection.isExist())) {
      // TODO: are there any other indexes that need to be created?
      await collection.createSystemIndex(
        { level: 1, index: 1 },
        { unique: true, session }
      );
      await collection.addTimestampMongoDb({ session });
    }
  }
}

export default ModelMerkleTree;
