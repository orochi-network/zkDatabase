import {
  ClientSession,
  CreateCollectionOptions,
  Document,
  WithoutId,
} from 'mongodb';
import logger from '../../helper/logger.js';
import { DatabaseEngine } from '../database-engine.js';

/**
 * ModelBasic is the most basic model of data. It interacts directly with DatabaseEngine
 * and provides .db and .collection to allow other models to interact with the database/collection.
 */
export default abstract class ModelBasic<T extends Document> {
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
}
