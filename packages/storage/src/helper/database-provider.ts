import { DatabaseEngine } from '../database';

export type ModelFactory = (db: DatabaseEngine) => any;

class ModelProvider {
  private static databaseMap = new Map<string, DatabaseEngine>();
  private static registerDatabase(dbKey: string, db: DatabaseEngine) {
    this.databaseMap.set(dbKey, db);
  }

  private static registerModel() {}
}
