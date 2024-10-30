import { ClientSession } from 'mongodb';
import { zkDatabaseConstants } from '../../common/index.js';
import { DB } from '../../helper/db-instance.js';
import ModelGeneral from '../base/general.js';

export type PrivateKey = {
  privateKey: string;
  databaseName: string
};

export class ModelSecureStorage extends ModelGeneral<PrivateKey> {
  private static instance: ModelSecureStorage | null = null;

  private constructor() {
    super(
      zkDatabaseConstants.globalProofDatabase,
      DB.proof,
      zkDatabaseConstants.globalCollections.proof
    );
  }

  public static getInstance(): ModelSecureStorage {
    if (!ModelSecureStorage.instance) {
      ModelSecureStorage.instance = new ModelSecureStorage();
      ModelSecureStorage.instance.collection.createIndex({ databaseName: 1 });
    }
    return ModelSecureStorage.instance;
  }
}
