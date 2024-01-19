import { Field } from 'o1js';
import { InsertOneResult, Document } from 'mongodb';
import ModelGeneral from './general';
import logger from '../helper/logger';

export type PooledLeaf = {
  index: bigint;
  hash: Field;
};

export class ModelMerkleTreePool extends ModelGeneral {
  private constructor(databaseName: string) {
    super(databaseName, 'merkle-tree-pool');
  }

  public static getInstance(databaseName: string): ModelMerkleTreePool {
    return new ModelMerkleTreePool(databaseName);
  }

  public async saveLeaf(index: bigint, leaf: Field): Promise<boolean> {
    let result: InsertOneResult<Document>;

    try {
      result = await this.insertOne({
        index,
        hash: leaf.toString(),
        created: new Date(Date.now()),
      });
    } catch (e) {
      logger.error('ModelMerkleTreePool::setLeaf()', e);
      return false;
    }

    return result.acknowledged;
  }

  public async getLatestLeaves(amount: number): Promise<PooledLeaf[]> {
    try {
      const leaves = await this.collection
        .find()
        .sort({ created: -1 })
        .limit(amount)
        .toArray();

      return leaves as any;
    } catch (e) {
      logger.error('ModelMerkleTreePool::getLatestLeaves()', e);
      throw e;
    }
  }
}

export default ModelMerkleTreePool;
