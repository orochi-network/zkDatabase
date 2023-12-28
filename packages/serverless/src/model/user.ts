import { randomBytes } from 'crypto';
import ModelCollection from './collection';
import { ZKDATABASE_MANAGEMENT_DB } from './abstract/database-engine';
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
        username: 'system',
        email: '',
        publicKey: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        userData: { description: 'System user' },
      },
      {
        username: 'nobody',
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
    if (['system', 'nobody'].includes(username)) {
      throw new Error('Username is reserved');
    }
    return this.insertOne({
      username,
      email,
      publicKey,
      createdAt: new Date(),
      updatedAt: new Date(),
      userData,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public async signIn(username: string): Promise<SessionSchema | null> {
    if (['system', 'nobody'].includes(username)) {
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
