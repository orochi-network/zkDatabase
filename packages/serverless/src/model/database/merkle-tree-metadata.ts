import { Field } from 'o1js';
import { Document, FindOptions, InsertOneOptions } from 'mongodb';
import logger from '../../helper/logger';
import ModelBasic from '../abstract/basic';
import { getCurrentTime } from '../../helper/common';

// This is data type for merkle tree metadata to be able to store in database
export interface MerkleTreeMetadata extends Document {
  date: Date;
  root: string;
  height: number;
}

export type TMerkleTreeMetadata = {
  date: Date;
  root: Field;
  height: number;
};

export class ModelMerkleTreeMetadata extends ModelBasic<MerkleTreeMetadata> {
  public static instances = new Map<string, ModelMerkleTreeMetadata>();


  public static getInstance(databaseName: string, collectionName: string) {
    const key = `${databaseName}.${collectionName}`;
    if (!ModelMerkleTreeMetadata.instances.has(key)) {
      ModelMerkleTreeMetadata.instances.set(
        key,
        new ModelMerkleTreeMetadata(databaseName, collectionName)
      );
    }
    return ModelMerkleTreeMetadata.instances.get(key)!;
  }


  public async setInitialHeight(height: number): Promise<boolean> {
    try {
      const result = await this.collection.insertOne({
        height,
        date: getCurrentTime(),
        root: '',
      });
      return result.acknowledged;
    } catch (error) {
      logger.error('Error setting initial tree height:', error);
      throw error;
    }
  }

  public async getHeight(): Promise<number | undefined> {
    try {
      const heightData = await this.collection.findOne({
        root: '',
      });
      return heightData ? heightData.height! : undefined;
    } catch (error) {
      logger.error('Error retrieving tree height:', error);
      throw error;
    }
  }

  public async createMetadata(
    root: Field,
    date: Date,
    options?: InsertOneOptions
  ): Promise<boolean> {
    const height = await this.getHeight();
    if (typeof height !== 'number') {
      throw new Error('Tree height is not set');
    }
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

  public async getLatestMetadata(
    options?: FindOptions
  ): Promise<TMerkleTreeMetadata | null> {
    try {
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
        // Date will be stored as string
        date: new Date(latestMetadataDocument.date!),
        root: Field(latestMetadataDocument.root!),
        height: latestMetadataDocument.height!,
      };

      return latestMetadata;
    } catch (error) {
      logger.error('Error retrieving latest metadata:', error);
      throw error;
    }
  }

  public async getMetadataByRoot(
    root: Field,
    options?: FindOptions
  ): Promise<TMerkleTreeMetadata | null> {
    try {
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
        date: new Date(metadataDocument.date!),
        root: Field(metadataDocument.root!),
        height: metadataDocument.height!,
      };

      return metadata;
    } catch (error) {
      logger.error('Error retrieving metadata by root:', error);
      throw error;
    }
  }
}
