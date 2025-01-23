import { TCollectionMetadataRecord } from '@zkdb/common';
import {
  DATABASE_ENGINE,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, FindOptions, OptionalId, NumericType } from 'mongodb';

export class ModelMetadataCollection extends ModelGeneral<
  OptionalId<TCollectionMetadataRecord>
> {
  private static collectionName: string =
    zkDatabaseConstant.databaseCollection.metadataCollection;

  private static instances: Record<string, any> = {};

  private constructor(databaseName: string) {
    super(
      databaseName,
      DATABASE_ENGINE.dbServerless,
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

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      databaseName,
      DATABASE_ENGINE.dbServerless,
      ModelMetadataCollection.collectionName
    );

    /*
      collectionName: string;
      owner: string;
      group: string;
      permission: number;
      schema: Object;
      createdAt: Date;
      updatedAt: Date;
    */
    if (!(await collection.isExist())) {
      await collection.createSystemIndex(
        { collectionName: 1 },
        { unique: true, session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}
