import { ClientSession, CreateCollectionOptions } from 'mongodb';
import { DatabaseEngine } from './database-engine.js';

/**
 * Model basic is the most basic model of data, It interactive directly to DatabaseEngine
 * And provide .db and .collection allow other model to interactive with database/collection
 */
export default abstract class ModelBasic {
  protected dbEngine: DatabaseEngine;

  protected databaseName: string | undefined;

  protected collectionName: string | undefined;

  protected collectionOptions: CreateCollectionOptions | undefined;

  constructor(
    databaseName?: string,
    collectionName?: string,
    collectionOptions?: CreateCollectionOptions
  ) {
    this.dbEngine = DatabaseEngine.getInstance();
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.collectionOptions = collectionOptions;
  }

  public get db() {
    return this.dbEngine.client.db(this.databaseName);
  }

  public get collection() {
    return this.db.collection(this.collectionName!);
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
      // logger.error('DatabaseEngine::withTransaction()', e);
      result = false;
      await session.abortTransaction();
    }
    return result;
  }
}
