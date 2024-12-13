import { TMetadataCollectionRecord } from '@zkdb/common';
import {
  DATABASE_ENGINE,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { FindOptions, OptionalId } from 'mongodb';

export class ModelMetadataCollection extends ModelGeneral<
  OptionalId<TMetadataCollectionRecord>
> {
  private static collectionName: string =
    zkDatabaseConstant.databaseCollection.metadataCollection;

  private static instances: Record<string, any> = {};

  private constructor(databaseName: string) {
    super(
      databaseName,
      DATABASE_ENGINE.serverless,
      ModelMetadataCollection.collectionName
    );
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

  public async getMetadata(collectionName: string, options?: FindOptions) {
    return this.findOne(
      {
        collectionName,
      },
      options
    );
  }

  public static async init(databaseName: string) {
    const collection = ModelCollection.getInstance(
      databaseName,
      DATABASE_ENGINE.serverless,
      ModelMetadataCollection.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ collection: 1 }, { unique: true });
    }
  }
}
