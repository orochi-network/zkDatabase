import { WithoutId } from 'mongodb';
import { zkDatabaseConstant } from '../../common/index.js';
import { DB } from '../../helper/db-instance.js';
import ModelGeneral from '../base/general.js';
import ModelCollection from '../general/collection.js';
import { TSecureStorageRecord } from '@zkdb/common';

export class ModelSecureStorage extends ModelGeneral<
  WithoutId<TSecureStorageRecord>
> {
  private static instance: ModelSecureStorage | null = null;

  private constructor() {
    super(
      zkDatabaseConstant.globalProofDatabase,
      DB.proof,
      zkDatabaseConstant.globalCollection.secure
    );
  }

  public static getInstance(): ModelSecureStorage {
    if (!ModelSecureStorage.instance) {
      ModelSecureStorage.instance = new ModelSecureStorage();
      ModelSecureStorage.instance.collection.createIndex({ databaseName: 1 });
    }
    return ModelSecureStorage.instance;
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalProofDatabase,
      DB.proof,
      zkDatabaseConstant.globalCollection.queue
    );
    /*
      privateKey: string;
      databaseName: string;
    */
    if (!(await collection.isExist())) {
      collection.index({ databaseName: 1 }, { unique: true });
      collection.index({ privateKey: 1 }, { unique: true });
    }
  }
}
