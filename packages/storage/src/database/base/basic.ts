import { zkDatabaseConstant } from '@common';
import { logger } from '@helper';
import {
  ClientSession,
  CreateCollectionOptions,
  CreateIndexesOptions,
  Document,
  IndexDirection,
} from 'mongodb';
import { DatabaseEngine } from '../database-engine';
import { JOI_ZKDB_FIELD_NAME } from '@zkdb/common';

type TIndexSpec = {
  [key: string]: IndexDirection;
};

/**
 * ModelBasic is the most basic model of data. It interacts directly with DatabaseEngine
 * and provides .db and .collection to allow other models to interact with the database/collection.
 */
export abstract class ModelBasic<T extends Document> {
  protected dbEngine: DatabaseEngine;

  protected databaseName: string;

  protected collectionName: string | undefined;

  protected collectionOptions: CreateCollectionOptions | undefined;

  constructor(
    databaseName: string,
    dbEngine: DatabaseEngine,
    collectionName?: string,
    collectionOptions?: CreateCollectionOptions
  ) {
    this.dbEngine = dbEngine;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.collectionOptions = collectionOptions;
  }

  public get db() {
    return this.dbEngine.client.db(this.databaseName);
  }

  public get collection() {
    if (!this.collectionName) {
      throw Error('Collection was not provided');
    }
    return this.db.collection<T>(this.collectionName);
  }

  public async withTransaction(
    callback: (session: ClientSession) => Promise<void>
  ): Promise<boolean> {
    const session = this.dbEngine.client.startSession();
    let result = false;
    try {
      await session.withTransaction(async () => callback(session), {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      });
      result = true;
      await session.commitTransaction();
    } catch (e) {
      logger.error('DatabaseEngine::withTransaction()', e);
      result = false;
      await session.abortTransaction();
    }
    return result;
  }

  public async createSystemIndex(
    indexSpec: TIndexSpec,
    indexOptions?: Omit<CreateIndexesOptions, 'name'>
  ): Promise<void> {
    const listIndexedField = Object.keys(indexSpec);
    listIndexedField.forEach((field) => {
      const { error } = JOI_ZKDB_FIELD_NAME.validate(field);
      if (error) {
        throw new Error(`Invalid field name ${field}: ${error}`);
      }
    });

    const fieldName = `${zkDatabaseConstant.systemIndex}_${Object.keys(indexSpec).join('_')}`;

    await this.collection.createIndex(indexSpec, {
      ...indexOptions,
      name: fieldName,
    });
  }

  public async addTimestampMongoDb(
    indexOptions?: Omit<CreateIndexesOptions, 'name'>
  ) {
    await this.createSystemIndex({ createdAt: 1 }, indexOptions);
    await this.createSystemIndex({ updatedAt: 1 }, indexOptions);
  }
}
