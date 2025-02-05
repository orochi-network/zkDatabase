import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TSecureStorageRecord } from '@zkdb/common';
import { ClientSession, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelSecureStorage extends ModelGeneral<
  OptionalId<TSecureStorageRecord>
> {
  // eslint-disable-next-line no-use-before-define
  private static instance: ModelSecureStorage | null = null;

  private constructor() {
    super(
      zkDatabaseConstant.globalMinaDatabase,
      DATABASE_ENGINE.dbMina,
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

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalMinaDatabase,
      DATABASE_ENGINE.dbMina,
      zkDatabaseConstant.globalCollection.secure
    );
    /*
      privateKey: string;
      databaseName: string;
    */
    if (!(await collection.isExist())) {
      await collection.createSystemIndex(
        { databaseName: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex(
        { privateKey: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex(
        { publicKey: 1 },
        { unique: true, session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}
