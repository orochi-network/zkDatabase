import { Field } from 'o1js';
import { InsertOneResult, Document } from 'mongodb';
import ModelGeneral from './general';
import logger from '../helper/logger';
import ModelCollection from './collection';
import { ZKDATABASE_MERKLE_TREE_POOL_COLLECTION } from './abstract/database-engine';

export type PooledLeaf = {
  index: bigint;
  hash: Field;
};

export class ModelMerkleTreePool extends ModelGeneral {
  private constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_MERKLE_TREE_POOL_COLLECTION);
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

  public async getOldestLeaves(amount: number): Promise<PooledLeaf[]> {
    try {
      const documents = await this.collection
        .find()
        .sort({ created: 1 })
        .limit(amount)
        .toArray();

      const leaves = documents.map(doc => ({
        index: doc.index,
        hash: Field(doc.hash)
      }));

      return leaves as PooledLeaf[];
    } catch (e) {
      logger.error(`ModelMerkleTreePool::getOldestLeaves() - Error fetching earliest ${amount} leaves:`, e);
      throw e;
    }
  }

  public async removeLeaves(leaves: PooledLeaf[]): Promise<void> {
    try {
      const leafHashes = leaves.map(leaf => leaf.hash.toString());
      await this.collection.deleteMany({
        hash: { $in: leafHashes }
      });
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
