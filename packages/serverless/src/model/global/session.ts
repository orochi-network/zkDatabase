import { Document } from 'mongodb';
import { randomBytes } from 'crypto';
import {
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import * as jose from 'jose';
import ModelUser from './user.js';
import { getCurrentTime } from '../../helper/common.js';

export interface DocumentSession extends Document {
  userName: string;
  sessionId: string;
  sessionKey: string;
  createdAt: Date;
  lastAccess: Date;
}

export class ModelSession extends ModelGeneral<DocumentSession> {
  // eslint-disable-next-line no-use-before-define
  private static instance: ModelSession | undefined;

  private static collectionName: string =
    zkDatabaseConstants.globalCollections.session;

  constructor() {
    super(zkDatabaseConstants.globalDatabase, ModelSession.collectionName);
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalDatabase,
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
