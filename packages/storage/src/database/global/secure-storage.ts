import { TDbRecord, TDatabaseKeyRecord } from '@zkdb/common';
import { zkDatabaseConstant } from '../../common/index.js';
import { DATABASE_ENGINE } from '../../helper/db-instance.js';
import ModelGeneral from '../base/general.js';
import ModelCollection from '../general/collection.js';

export class ModelSecureStorage extends ModelGeneral<TDatabaseKeyRecord> {
  private static instance: ModelSecureStorage | null = null;

  private constructor() {
    super(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
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
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.queue
    );
    if (!(await collection.isExist())) {
      collection.index({ databaseName: 1 }, { unique: true });
      collection.index({ privateKey: 1 }, { unique: true });
    }
  }
}
