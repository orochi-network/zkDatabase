import { Document } from 'mongodb';
import { randomBytes } from 'crypto';
import { ModelGeneral, zkDatabaseConstants } from '@zkdb/storage';
import ModelUser from './user';
import { getCurrentTime } from '../../helper/common';

export interface DocumentSession extends Document {
  userName: string;
  sessionId: string;
  sessionKey: string;
  createdAt: Date;
  lastAccess: Date;
}

export class ModelSession extends ModelGeneral<DocumentSession> {
  private static collectionName: string = zkDatabaseConstants.globalCollections.session;

  constructor() {
    super(zkDatabaseConstants.globalDatabase, ModelSession.collectionName);
  }

  public async create(userName: string): Promise<DocumentSession | null> {
    ModelUser.isValidUser(userName);
    const sessionData = {
      userName,
      sessionId: randomBytes(32).toString('hex'),
      sessionKey: randomBytes(32).toString('hex'),
      createdAt: getCurrentTime(),
      lastAccess: getCurrentTime(),
    };
    const newSession = await this.insertOne(sessionData);

    return newSession.acknowledged ? sessionData : null;
  }

  public async delete(sessionId: string) {
    return this.deleteOne({
      sessionId,
    });
  }

  public async refresh(sessionId: string) {
    return this.updateOne(
      { sessionId },
      {
        $set: { lastAccess: getCurrentTime() },
      }
    );
  }
}

export default ModelSession;
