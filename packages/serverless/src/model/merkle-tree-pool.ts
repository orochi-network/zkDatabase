import { Field } from 'o1js';
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
    try {
      const options = this.session ? { session: this.session } : undefined;
      const result = await this.collection.insertOne(
        {
          index,
          hash: leaf.toString(),
          created: new Date(),
        },
        options
      );

      return result.acknowledged;
    } catch (e) {
      logger.error('ModelMerkleTreePool::saveLeaf()', e);
      return false;
    }
  }

  public async getOldestLeaves(amount: number): Promise<PooledLeaf[]> {
    try {
      const options = this.session ? { session: this.session } : undefined;
      const documents = await this.collection
        .find({}, options)
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

  public async removeLeaves(leaves: PooledLeaf[]): Promise<void> {
    try {
      const options = this.session ? { session: this.session } : undefined;
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
