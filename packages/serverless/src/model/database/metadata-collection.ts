import { TDbRecord, TMetadataCollection } from '@zkdb/common';
import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, FindOptions, WithoutId } from 'mongodb';

export interface IMetadataCollection
  extends Omit<TDbRecord<TMetadataCollection>, 'sizeOnDisk'> {}

export class ModelMetadataCollection extends ModelGeneral<
  WithoutId<IMetadataCollection>
> {
  private static collectionName: string =
    zkDatabaseConstant.databaseCollection.metadataCollection;

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

  public async getMetadata(collectionName: string, options?: FindOptions) {
    return this.findOne(
      {
        collectionName,
      },
      options
    );
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      databaseName,
      DB.service,
      ModelMetadataCollection.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ collectionName: 1 }, { unique: true, session });
    }
  }
}
