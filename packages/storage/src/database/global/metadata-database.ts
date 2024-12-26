import { zkDatabaseConstant } from '@common';
import {
  addTimestampMongoDB,
  createSystemIndex,
  DATABASE_ENGINE,
  ZkDbMongoIndex,
} from '@helper';
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
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.metadata_database
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
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.proof
    );
    if (!(await collection.isExist())) {
      /*
        databaseName: string;
        databaseOwner: string;
        merkleHeight: number;
        appPublicKey: string;
      */
      await createSystemIndex(
        collection,
        { databaseName: 1 },
        { unique: true, session }
      );
      await createSystemIndex(collection, { merkleHeight: 1 }, { session });
      await createSystemIndex(collection, { appPublicKey: 1 }, { session });

      // Compound index
      await createSystemIndex(
        collection,
        { databaseName: 1, databaseOwner: 1 },
        {
          unique: true,
          session,
        }
      );
      await createSystemIndex(
        collection,
        { databaseOwner: 1, merkleHeight: 1 },

        {
          session,
        }
      );
      // Timestamp index
      await addTimestampMongoDB(collection, session);
    }
  }
}
