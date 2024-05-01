import { ModelCollection, ModelGeneral, zkDatabaseConstants } from '@zkdb/storage';
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
    super(zkDatabaseConstants.globalDatabase, ModelOwnership.collectionName);
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalDatabase,
      ModelOwnership.collectionName
    );
    if (!(await collection.isExist())) {
      collection.index({ owner: 1 }, { unique: true });
      collection.index({ databaseName: 1 }, { unique: true });
    }
  }
}

export default ModelOwnership;
