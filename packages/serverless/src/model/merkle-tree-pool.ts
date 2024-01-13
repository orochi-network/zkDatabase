import { InsertOneResult, Document } from 'mongodb';
import ModelGeneral from './general';
import logger from '../helper/logger';

export class ModelMerkleTreePool extends ModelGeneral {
  private constructor(databaseName: string) {
    super(databaseName, 'merkle-tree-pool');
  }

  public static getInstance(databaseName: string): ModelMerkleTreePool {
    return new ModelMerkleTreePool(databaseName);
  }

  public async saveLeaf(index: bigint, leaf: string): Promise<boolean> {
    let result: InsertOneResult<Document>;

    try {
      result = await this.insertOne({
        index,
        leaf,
      });
    } catch (e) {
      logger.error('ModelMerkleTreePool::setLeaf()', e);
      return false;
    }

    return result.acknowledged;
  }
}

export default ModelMerkleTreePool;
