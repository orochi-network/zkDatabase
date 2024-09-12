import { signIn, signOut, signUp, setJwtPayloadFunction } from '@zkdb/api';
import storage from '../storage/storage.js';
import { IStorage } from '../storage/interface/storage.js';
import { SignedData } from '../../types/signing.js';

export abstract class BaseAuthenticator {
  constructor() {
    setJwtPayloadFunction(() => {
      const session = storage.getSession();
      const userInfo = storage.getUserInfo();
      if (session && userInfo) {
        return {
          sessionId: session.sessionId,
          sessionKey: session.sessionKey,
          userInfo: {
            email: userInfo.email,
            userName: userInfo.userName,
          },
        };
      }
      return null;
    });
  }

  isLoggedIn(): boolean {
    return storage.getSession() !== null;
  }

  protected async sendLoginRequest(email: string, proof: SignedData) {
    const result = await signIn(email, proof);

    if (result.isObject()) {
      const userData = result.unwrapObject();
      this.getStorage().setSession({
        sessionId: userData.session.sessionId,
        sessionKey: userData.session.sessionKey,
      });

      this.getStorage().setUserInfo({
        email: userData.user.email,
        userName: userData.user.userName,
        publicKey: userData.user.publicKey,
      });
    } else {
      if (result.isError()) {
        throw result.unwrapError();
      } else {
        throw Error('Unknown error');
      }
    }
  }

  protected async sendRegistrationRequest(
    email: string,
    userName: string,
    proof: SignedData
  ) {
    const result = await signUp(proof, {
      ...{
        userName,
        email,
      },
      timestamp: Math.floor(Date.now() / 1000),
      userData: {},
    });

    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }

  protected getStorage(): IStorage {
    return storage;
  }

  async logOut(): Promise<void> {
    try {
      await signOut();
    } finally {
      storage.clear();
    }
  }
}
