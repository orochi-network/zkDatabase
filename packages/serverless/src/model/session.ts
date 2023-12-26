import { ZKDATABASE_MANAGEMENT_DB } from './abstract/database-engine';
import ModelCollection from './collection';
import { ModelGeneral } from './general';

export type SessionSchema = {
  username: string;
  sessionId: string;
  sessionKey: string;
  createdAt: Date;
};

export class ModelSession extends ModelGeneral {
  constructor() {
    super(ZKDATABASE_MANAGEMENT_DB, 'session');
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create([
      'username',
      'sessionKey',
      'sessionId',
    ]);
  }
}

export default ModelSession;
