import { Document } from 'mongodb';
import { ZKDATABASE_GLOBAL_DB } from '../../common/const';
import { ModelGeneral } from '../abstract/general';
import ModelCollection from '../abstract/collection';

export interface DocumentOwnership extends Document {
  databaseName: string;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelOwnership extends ModelGeneral<DocumentOwnership> {
  static collectionName: string = 'ownership';

  constructor() {
    super(ZKDATABASE_GLOBAL_DB, ModelOwnership.collectionName);
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      ZKDATABASE_GLOBAL_DB,
      ModelOwnership.collectionName
    );
    if (!(await collection.isExist())) {
      collection.index({ owner: 1 }, { unique: true });
      collection.index({ databaseName: 1 }, { unique: true });
    }
  }
}

export default ModelOwnership;
