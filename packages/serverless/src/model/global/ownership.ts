import { TOwnershipRecord } from '@zkdb/common';
import {
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
      await collection.createSystemIndex(
        { databaseName: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex({ owner: 1 }, { session });

      // Compound index
      await collection.createSystemIndex(
        { databaseName: 1, owner: 1 },
        { unique: true, session }
      );
      // Timestamp index
      await collection.addTimestampMongoDb({ session });
    }
  }
}

export default ModelOwnership;
