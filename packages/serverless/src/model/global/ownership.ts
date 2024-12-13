import { TOwnershipRecord } from '@zkdb/common';
import {
  addTimestampMongoDB,
  DATABASE_ENGINE,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, WithoutId } from 'mongodb';

export class ModelOwnership extends ModelGeneral<WithoutId<TOwnershipRecord>> {
  static collectionName: string = 'ownership';

  constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      ModelOwnership.collectionName
    );
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      ModelOwnership.collectionName
    );
    /*
      databaseName: string;
      owner: string;
      createdAt: Date
      updatedAt: Date
    */
    if (!(await collection.isExist())) {
      await collection.index({ databaseName: 1 }, { unique: true, session });
      await collection.index({ owner: 1 }, { unique: false, session });

      // Compound index
      await collection.index(
        { databaseName: 1, owner: 1 },
        { unique: true, session }
      );
      // Timestamp index
      await addTimestampMongoDB(collection, session);
    }
  }
}

export default ModelOwnership;
