import { TOwnershipRecord } from '@zkdb/common';
import {
  addTimestampMongoDB,
  DB,
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
      DB.service,
      ModelOwnership.collectionName
    );
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalDatabase,
      DB.service,
      ModelOwnership.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index(
        { databaseName: 1, owner: 1 },
        { unique: true, session }
      );
      await collection.index({ databaseName: 1 }, { unique: true, session });
      await collection.index({ owner: 1 }, { unique: false, session });

      await addTimestampMongoDB(collection, session);
    }
  }
}

export default ModelOwnership;
