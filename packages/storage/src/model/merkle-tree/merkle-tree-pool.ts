import { Field } from 'o1js';
import { ClientSession } from 'mongodb';
import { ModelGeneral } from '../abstract/general';
import logger from '../../helper/logger';

export type PooledLeaf = {
  index: bigint;
  hash: Field;
};

export class ModelMerkleTreePool extends ModelGeneral {
  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, collectionName);
  }

  public static getInstance(
    databaseName: string,
    collectionName: string
  ): ModelMerkleTreePool {
    return new ModelMerkleTreePool(databaseName, collectionName);
  }

  public async saveLeaf(
    index: bigint,
    leaf: Field,
    session?: ClientSession
  ): Promise<boolean> {
    try {
      const result = await this.collection.insertOne(
        {
          index,
          hash: leaf.toString(),
          created: new Date(),
        },
        { session }
      );

      return result.acknowledged;
    } catch (e) {
      logger.error('ModelMerkleTreePool::saveLeaf()', e);
      return false;
    }
  }

  public async getOldestLeaves(
    amount: number,
    session?: ClientSession
  ): Promise<PooledLeaf[]> {
    try {
      const documents = await this.collection
        .find({}, { session })
        .sort({ created: 1 })
        .limit(amount)
        .toArray();

      return documents.map((doc) => ({
        index: doc.index,
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
    leaves: PooledLeaf[],
    session?: ClientSession
  ): Promise<void> {
    try {
      const leafHashes = leaves.map((leaf) => leaf.hash.toString());
      await this.collection.deleteMany(
        {
          hash: { $in: leafHashes },
        },
        { session }
      );
    } catch (e) {
      logger.error('ModelMerkleTreePool::removeLeaves()', e);
      throw e;
    }
  }
}

export default ModelMerkleTreePool;
