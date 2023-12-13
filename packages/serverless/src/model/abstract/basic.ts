import { ClientSession } from 'mongodb';
import { DatabaseEngine } from './database-engine';
import logger from '../../helper/logger';

export abstract class ModelBasic {
  protected dbEngine: DatabaseEngine;

  protected databaseName: string | undefined;

  protected collectionName: string | undefined;

  constructor(databaseName?: string, collectionName?: string) {
    this.dbEngine = DatabaseEngine.getInstance();
    this.databaseName = databaseName;
    this.collectionName = collectionName;
  }

  protected get db() {
    return this.dbEngine.client.db(this.databaseName!);
  }

  protected get collection() {
    return this.db.collection(this.collectionName!);
  }

  public async withTransaction(
    callback: (session: ClientSession) => Promise<void>
  ): Promise<boolean> {
    const session = this.dbEngine.client.startSession();
    let result = false;
    try {
      await session.withTransaction(
        async () => callback(session)
        ,
        {
          readPreference: 'primary',
          readConcern: { level: 'local' },
          writeConcern: { w: 'majority' },
        }
      );
      result = true;
    } catch (e) {
      logger.error('DatabaseEngine::withTransaction()', e);
    } finally {
      await session.endSession();
      return result;
    }
  }
}
