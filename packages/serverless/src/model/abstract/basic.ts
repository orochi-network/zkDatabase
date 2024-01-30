import { ClientSession, CreateCollectionOptions } from 'mongodb';
import { DatabaseEngine } from './database-engine';
import logger from '../../helper/logger';

export default abstract class ModelBasic {
  protected dbEngine: DatabaseEngine;

  protected databaseName: string | undefined;

  protected collectionName: string | undefined;

  protected collectionOptions: CreateCollectionOptions | undefined;

  protected session?: ClientSession;

  constructor(databaseName?: string, collectionName?: string, collectionOptions?: CreateCollectionOptions) {
    this.dbEngine = DatabaseEngine.getInstance();
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.collectionOptions = collectionOptions;
  }

  protected get db() {
    return this.dbEngine.client.db(this.databaseName!);
  }

  protected get collection() {
    return this.db.collection(this.collectionName!, this.collectionOptions);
  }

  public setSession(session: ClientSession | undefined): void {
    this.session = session;
  }

  public removeSession() {
    this.setSession(undefined);
  }

  public async withTransaction(
    callback: (session: ClientSession) => Promise<void>
  ): Promise<boolean> {
    const session = this.dbEngine.client.startSession();
    let result: boolean = false;
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
