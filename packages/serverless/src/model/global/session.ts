import { Document } from 'mongodb';
import { randomBytes } from 'crypto';
import { ModelGeneral, zkDatabaseConstants } from '@zkdb/storage';
import ModelUser from './user';
import { getCurrentTime } from '../../helper/common';
import ModelCollection from '../abstract/collection';

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

  public static async init() {
    const collection = ModelCollection.getInstance(
      ZKDATABASE_GLOBAL_DB,
      ModelSession.collectionName
    );
    if (!(await collection.isExist())) {
      collection.index({ userName: 1 }, { unique: true });
      collection.index({ sessionId: 1 }, { unique: true });
    }
  }

  public static getInstance() {
    if (typeof ModelSession.instance === 'undefined') {
      ModelSession.instance = new ModelSession();
    }
    return ModelSession.instance;
  }

  public async create(userName: string): Promise<DocumentSession | null> {
    ModelUser.isValidUser(userName);
    const sessionData = {
      userName,
      sessionId: jose.base64url.encode(randomBytes(32)),
      sessionKey: jose.base64url.encode(randomBytes(32)),
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
