import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
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
      zkDatabaseConstant.globalDatabase,
      DB.service,
      ModelOwnership.collectionName
    );
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalDatabase,
      DB.service,
      ModelOwnership.collectionName
    );
    if (!(await collection.isExist())) {
      collection.index({ owner: 1 }, { unique: true });
      collection.index({ databaseName: 1 }, { unique: true });
    }
  }
}

export default ModelOwnership;
