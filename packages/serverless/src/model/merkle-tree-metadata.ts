import { ObjectId } from 'mongodb';
import ModelGeneral from './general';
import logger from '../helper/logger';

const MERKLE_TREE_METADATA_INDEX = 'merkle_metadata_index';

export type TMerkleTreeMetadata = {
  height: number;
  root: string;
};

export class ModelMerkleTreeMetadata extends ModelGeneral {
  private constructor(databaseName: string) {
    super(databaseName, 'merkle-tree-metadata');
  }

  private async doesMetadataExist(): Promise<boolean> {
    const id = new ObjectId(MERKLE_TREE_METADATA_INDEX);
    try {
      return (await this.findOne({ _id: id })) !== null;
    } catch (error) {
      logger.error('Error checking metadata existence:', error);
      throw error;
    }
  }

  public async create(height: number, root: string): Promise<boolean> {
    try {
      if (await this.doesMetadataExist()) {
        return false;
      }

      const id = new ObjectId(MERKLE_TREE_METADATA_INDEX);
      const result = await this.insertOne({
        _id: id,
        height,
        root,
      });

      return result.acknowledged;
    } catch (error) {
      logger.error('Error creating metadata:', error);
      throw error;
    }
  }

  public async getMetadata(): Promise<TMerkleTreeMetadata | null> {
    try {
      const id = new ObjectId(MERKLE_TREE_METADATA_INDEX);
      const metadata = await this.findOne({ _id: id });
      if (!metadata) return null;

      return metadata as any as TMerkleTreeMetadata;
    } catch (error) {
      logger.error('Error retrieving metadata:', error);
      throw error;
    }
  }

  public async updateRoot(newRoot: string): Promise<boolean> {
    try {
      if (!(await this.doesMetadataExist())) {
        return false;
      }

      const id = new ObjectId(MERKLE_TREE_METADATA_INDEX);
      const updateResult = await this.updateOne(
        { _id: id },
        { $set: { root: newRoot } }
      );

      return updateResult.modifiedCount === 1;
    } catch (error) {
      logger.error('Error updating root:', error);
      throw error;
    }
  }
}
