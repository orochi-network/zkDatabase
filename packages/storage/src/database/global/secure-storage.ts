import { zkDatabaseConstants } from '../../common/index.js';
import { DB } from '../../helper/db-instance.js';
import ModelGeneral from '../base/general.js';
import ModelCollection from '../general/collection.js';

export type PrivateKey = {
  privateKey: string;
  databaseName: string;
};

export class ModelSecureStorage extends ModelGeneral<PrivateKey> {
  private static instance: ModelSecureStorage | null = null;

  private constructor() {
    super(
      zkDatabaseConstants.globalProofDatabase,
      DB.proof,
      zkDatabaseConstants.globalCollections.secure
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
      zkDatabaseConstants.globalProofDatabase,
      DB.proof,
      zkDatabaseConstants.globalCollections.queue
    );
    if (!(await collection.isExist())) {
      collection.index({ databaseName: 1 }, { unique: true });
      collection.index({ privateKey: 1 }, { unique: true });
    }
  }
}
