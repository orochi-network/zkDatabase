import {
  DatabaseEngine,
  ZKDATABASE_MANAGEMENT_DB,
} from './abstract/database-engine';
import ModelCollection from './collection';

import { ModelDocument } from './document';

export type SessionSchema = {
  username: string;
  sessionId: string;
  sessionKey: string;
  createdAt: Date;
};

export class ModelSession extends ModelDocument {
  constructor() {
    super(ZKDATABASE_MANAGEMENT_DB, 'session');
  }

  public async create() {
    if (
      await DatabaseEngine.getInstance().isCollection(
        this.databaseName || '',
        this.collectionName || ''
      )
    ) {
      return new ModelCollection(this.databaseName, this.collectionName).create(
        ['username', 'sessionKey', 'sessionId']
      );
    }
    throw new Error('Database and collection was not set');
  }
}

export default ModelSession;
