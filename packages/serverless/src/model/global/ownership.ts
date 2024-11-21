import {
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { DB_INSTANCE } from 'helper/model-loader';
import { Document } from 'mongodb';

export interface DocumentOwnership extends Document {
  databaseName: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelOwnership extends ModelGeneral<DocumentOwnership> {
  static collectionName: string = 'ownership';

  constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      DB_INSTANCE.service,
      ModelOwnership.collectionName
    );
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalDatabase,
      DB_INSTANCE.service,
      ModelOwnership.collectionName
    );
    if (!(await collection.isExist())) {
      collection.index({ owner: 1 }, { unique: true });
      collection.index({ databaseName: 1 }, { unique: true });
    }
  }
}

export default ModelOwnership;
