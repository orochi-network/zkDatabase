import { Field } from 'o1js';
import {
  FindOptions,
  InsertOneOptions,
  Document,
  DeleteOptions,
} from 'mongodb';
import ModelGeneral from '../abstract/general';
import logger from '../../helper/logger';
import ModelCollection from '../abstract/collection';

// Data type for merkle tree pool to be able to store in database
export interface PooledLeaf extends Document {
  index: string;
  hash: string;
}

export type TPooledLeaf = {
  index: bigint;
  hash: Field;
};

export class ModelMerkleTreePool extends ModelGeneral<PooledLeaf> {
  public static instances = new Map<string, ModelMerkleTreePool>();

  public static getInstance(databaseName: string, collectionName: string) {
    const key = `${databaseName}.${collectionName}`;
    if (!ModelMerkleTreePool.instances.has(key)) {
      ModelMerkleTreePool.instances.set(
        key,
        new ModelMerkleTreePool(databaseName, collectionName)
      );
    }
    return ModelMerkleTreePool.instances.get(key)!;
  }

  public async saveLeaf(
    index: bigint,
    leaf: Field,
    opt?: InsertOneOptions
  ): Promise<boolean> {
    try {
      const result = await this.collection.insertOne(
        {
          index: index.toString(),
          hash: leaf.toString(),
          created: new Date(),
        },
        opt
      );

      return result.acknowledged;
    } catch (e) {
      logger.error('ModelMerkleTreePool::saveLeaf()', e);
      return false;
    }
  }

  public async getOldestLeaves(
    amount: number,
    option?: FindOptions
  ): Promise<TPooledLeaf[]> {
    try {
      const documents = await this.collection
        .find({}, option)
        .sort({ created: 1 })
        .limit(amount)
        .toArray();

      return documents.map((doc) => ({
        index: BigInt(doc.index),
        hash: Field(doc.hash),
      }));
    } catch (e) {
      logger.error(
        `ModelMerkleTreePool::getOldestLeaves() - Error fetching earliest ${amount} leaves:`,
        e
      );
      throw e;
    }
  }

  public async removeLeaves(
    leaves: TPooledLeaf[],
    options?: DeleteOptions
  ): Promise<void> {
    try {
      const leafHashes = leaves.map((leaf) => leaf.hash.toString());
      await this.collection.deleteMany(
        {
          hash: { $in: leafHashes },
        },
        options
      );
    } catch (e) {
      logger.error('ModelMerkleTreePool::removeLeaves()', e);
      throw e;
    }
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create({
      hash: 1,
    });
  }
}

export default ModelMerkleTreePool;
