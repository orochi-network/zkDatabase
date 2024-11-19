import { zkDatabaseConstants } from '../../common/index.js';
import ModelGeneral from '../base/general.js';
import { DatabaseEngine } from '../database-engine.js';
import ModelCollection from '../general/collection.js';

export type PrivateKey = {
  privateKey: string;
  databaseName: string;
};

export class ModelSecureStorage extends ModelGeneral<PrivateKey> {
  private static instance: ModelSecureStorage | null = null;
  private static dbEngine: DatabaseEngine;

  // proof
  private constructor() {
    super(
      zkDatabaseConstants.globalProofDatabase,
      ModelSecureStorage.dbEngine,
      zkDatabaseConstants.globalCollections.secure
    );
  }

  public static createModel(dbEngine: DatabaseEngine) {
    ModelSecureStorage.dbEngine = dbEngine;
  }
  public static getInstance(): ModelSecureStorage {
    if (!ModelSecureStorage.instance) {
      ModelSecureStorage.instance = new ModelSecureStorage();
      ModelSecureStorage.instance.collection.createIndex({ databaseName: 1 });
    }
    return ModelSecureStorage.instance;
  }

  public static async init(dbEngine: DatabaseEngine) {
    ModelSecureStorage.createModel(dbEngine);
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalProofDatabase,
      dbEngine,
      zkDatabaseConstants.globalCollections.queue
    );
    if (!(await collection.isExist())) {
      collection.index({ databaseName: 1 }, { unique: true });
      collection.index({ privateKey: 1 }, { unique: true });
    }
  }
}
