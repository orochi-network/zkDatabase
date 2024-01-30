import { Field } from 'o1js';
import logger from '../helper/logger';
import { ZKDATABASE_MERKLE_TREE_METADATA_COLLECTION } from './abstract/database-engine';
import ModelBasic from './abstract/basic';

export type TMerkleTreeMetadata = {
  date: Date;
  root: Field;
  height: number;
};

export class ModelMerkleTreeMetadata extends ModelBasic {
  private constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_MERKLE_TREE_METADATA_COLLECTION);
  }

  public async setInitialHeight(height: number): Promise<boolean> {
    const initialHeightData = { height };
    try {
      const result = await this.collection.insertOne(initialHeightData);
      return result.acknowledged;
    } catch (error) {
      logger.error('Error setting initial tree height:', error);
      throw error;
    }
  }

  public async getHeight(): Promise<number | null> {
    try {
      const heightData = await this.collection.findOne(
        {},
        { projection: { height: 1 } }
      );
      return heightData ? heightData.height : null;
    } catch (error) {
      logger.error('Error retrieving tree height:', error);
      throw error;
    }
  }

  public async createMetadata(root: Field, date: Date): Promise<boolean> {
    const options = this.session ? { session: this.session } : undefined;

    const height = await this.getHeight();
    try {
      const result = await this.collection.insertOne(
        {
          date,
          height,
          root: root.toString(),
        },
        options
      );

      return result.acknowledged;
    } catch (error) {
      logger.error('Error creating metadata:', error);
      throw error;
    }
  }

  public async getLatestMetadata(): Promise<TMerkleTreeMetadata | null> {
    try {
      const options = this.session ? { session: this.session } : undefined;

      const result = await this.collection
        .find({}, options)
        .sort({ date: -1 })
        .limit(1)
        .toArray();
      if (result.length === 0) {
        return null;
      }

      const latestMetadataDocument = result[0];
      const latestMetadata: TMerkleTreeMetadata = {
        date: latestMetadataDocument.date,
        root: Field(latestMetadataDocument.root),
        height: latestMetadataDocument.height,
      };

      return latestMetadata;
    } catch (error) {
      logger.error('Error retrieving latest metadata:', error);
      throw error;
    }
  }

  public async getMetadataByRoot(
    root: Field
  ): Promise<TMerkleTreeMetadata | null> {
    try {
      const options = this.session ? { session: this.session } : undefined;

      const metadataDocument = await this.collection.findOne(
        {
          root: root.toString(),
        },
        options
      );
      if (!metadataDocument) {
        return null;
      }

      const metadata: TMerkleTreeMetadata = {
        date: metadataDocument.date,
        root: Field(metadataDocument.root),
        height: metadataDocument.height,
      };

      return metadata;
    } catch (error) {
      logger.error('Error retrieving metadata by root:', error);
      throw error;
    }
  }

  public static getInstance(databaseName: string): ModelMerkleTreeMetadata {
    return new ModelMerkleTreeMetadata(databaseName);
  }
}
