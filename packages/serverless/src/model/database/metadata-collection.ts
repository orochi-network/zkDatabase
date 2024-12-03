import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { Document, FindOptions } from 'mongodb';
import { TMetadataCollection } from '../../types/index.js';

export interface IMetadataCollection extends Document, TMetadataCollection {}

export class ModelMetadataCollection extends ModelGeneral<IMetadataCollection> {
  private static collectionName: string =
    zkDatabaseConstants.databaseCollections.metadataCollection;

  private static instances: Record<string, any> = {};

  private constructor(databaseName: string) {
    super(databaseName, DB.service, ModelMetadataCollection.collectionName);
  }

  public static getInstance(databaseName: string): ModelMetadataCollection {
    if (
      typeof ModelMetadataCollection.instances[databaseName] === 'undefined'
    ) {
      ModelMetadataCollection.instances[databaseName] =
        new ModelMetadataCollection(databaseName);
    }
    return ModelMetadataCollection.instances[databaseName];
  }

  public async getMetadata(
    collectionName: string,
    options?: FindOptions
  ): Promise<IMetadataCollection | null> {
    return this.findOne(
      {
        collection: collectionName,
      },
      options
    );
  }

  public static async init(databaseName: string) {
    const collection = ModelCollection.getInstance(
      databaseName,
      DB.service,
      ModelMetadataCollection.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ collection: 1 }, { unique: true });
    }
  }
}