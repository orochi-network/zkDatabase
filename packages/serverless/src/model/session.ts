import { ZKDATABASE_MANAGEMENT_DB } from './abstract/database-engine';
import ModelCollection from './collection';
import { ModelGeneral } from './general';

export type SessionSchema = {
  username: string;
  sessionId: string;
  sessionKey: string;
  createdAt: Date;
  lastAccess: Date;
};

export class ModelSession extends ModelGeneral {
  constructor() {
    super(ZKDATABASE_MANAGEMENT_DB, 'session');
  }

  public static async init() {
    return new ModelCollection(ZKDATABASE_MANAGEMENT_DB, 'session').create([
      { username: 1 },
      { sessionKey: 1 },
      { sessionId: 1 },
    ]);
  }

  public async refresh(sessionId: string) {
    return this.updateOne(
      { sessionId },
      {
        $set: { lastAccess: new Date() },
      }
    );
  }
}

export default ModelSession;
