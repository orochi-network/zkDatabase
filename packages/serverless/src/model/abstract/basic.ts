import { ClientSession } from 'mongodb';
import { DatabaseEngine } from './database-engine';

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
  ) {
    const session = this.dbEngine.client.startSession();
    try {
      await session.withTransaction(
        async () => {
          await callback(session);
        },
        {
          readPreference: 'primary',
          readConcern: { level: 'local' },
          writeConcern: { w: 'majority' },
        }
      );
    } catch (e) {
      console.log('DatabaseEngine::withTransaction()', e);
    } finally {
      await session.endSession();
    }
  }
}
