import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TMetadataDatabase, TMetadataDatabaseRecord } from '@zkdb/common';
import { ClientSession, Filter, FindOptions, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

const SYSTEM_DATABASE_SET = new Set(['admin', 'local', '_zkdatabase_metadata']);

export class ModelMetadataDatabase extends ModelGeneral<
  OptionalId<TMetadataDatabaseRecord>
> {
  private static instance: ModelMetadataDatabase;

  constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.dbServerless,
      zkDatabaseConstant.globalCollection.metadataDatabase
    );
  }

  public static getInstance() {
    if (!ModelMetadataDatabase.instance) {
      this.instance = new ModelMetadataDatabase();
    }
    return this.instance;
  }

  public async list(
    filter: Filter<TMetadataDatabase>,
    options?: FindOptions
  ): Promise<TMetadataDatabase[]> {
    try {
      // Prevent user getting system database
      return (await this.collection.find(filter, options).toArray()).filter(
        (db) => !SYSTEM_DATABASE_SET.has(db.databaseName)
      );
    } catch (error) {
      throw new Error(`Failed to find database: ${error}`);
    }
  }

  public async count(filter?: Filter<TMetadataDatabase>) {
    return await this.collection.countDocuments(filter);
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TMetadataDatabase>(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.dbServerless,
      zkDatabaseConstant.globalCollection.metadataDatabase
    );
    if (!(await collection.isExist())) {
      /*
        databaseName: string;
        databaseOwner: string;
        merkleHeight: number;
        appPublicKey: string;
      */
      await collection.createSystemIndex(
        { databaseName: 1 },
        { unique: true, session }
      );

      await collection.createSystemIndex({ merkleHeight: 1 }, { session });
      await collection.createSystemIndex({ appPublicKey: 1 }, { session });

      // Compound index
      await collection.createSystemIndex(
        { databaseName: 1, databaseOwner: 1 },
        {
          unique: true,
          session,
        }
      );

      await collection.createSystemIndex(
        { databaseOwner: 1, merkleHeight: 1 },

        {
          session,
        }
      );
      // Timestamp index
      await collection.addTimestampMongoDb({ session });
    }
  }
}
