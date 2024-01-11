import { randomBytes } from 'crypto';
import ModelCollection from './collection';
import {
  ZKDATABAES_USER_NOBODY,
  ZKDATABAES_USER_SYSTEM,
  ZKDATABASE_MANAGEMENT_DB,
} from '../common/const';
import ModelSession, { SessionSchema } from './session';
import { ModelGeneral } from './general';

export type UserSchema = {
  username: string;
  email: string;
  publicKey: string;
  userData: any;
  createdAt: Date;
  updatedAt: Date;
};

export class ModelUser extends ModelGeneral {
  constructor() {
    super(ZKDATABASE_MANAGEMENT_DB, 'user');
  }

  public static async init() {
    const userCollection = new ModelCollection(
      ZKDATABASE_MANAGEMENT_DB,
      'user'
    );
    await userCollection.create(
      [{ username: 1 }, { email: 1 }, { publicKey: 1 }],
      {
        unique: true,
      }
    );
    await new ModelUser().insertMany([
      {
        username: ZKDATABAES_USER_SYSTEM,
        email: '',
        publicKey: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        userData: { description: 'System user' },
      },
      {
        username: ZKDATABAES_USER_NOBODY,
        email: '',
        publicKey: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        userData: { description: 'Nobody user' },
      },
    ]);
  }

  public async signUp(
    username: string,
    email: string,
    publicKey: string,
    userData: any
  ) {
    if ([ZKDATABAES_USER_NOBODY, ZKDATABAES_USER_SYSTEM].includes(username)) {
      throw new Error('Username is reserved');
    }
    return this.insertOne({
      username,
      email,
      publicKey,
      userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public async signIn(username: string): Promise<SessionSchema | null> {
    if ([ZKDATABAES_USER_NOBODY, ZKDATABAES_USER_SYSTEM].includes(username)) {
      throw new Error('This username cannot be used');
    }
    const modelSession = new ModelSession();
    const sessionData: SessionSchema = {
      username,
      sessionId: randomBytes(32).toString('hex'),
      sessionKey: randomBytes(32).toString('hex'),
      createdAt: new Date(),
      lastAccess: new Date(),
    };
    const newSession = await modelSession.insertOne(sessionData);

    return newSession.acknowledged ? sessionData : null;
  }

  // eslint-disable-next-line class-methods-use-this
  public async signOut(sessionId: string) {
    return new ModelSession().deleteOne({
      sessionId,
    });
  }
}

export default ModelUser;
