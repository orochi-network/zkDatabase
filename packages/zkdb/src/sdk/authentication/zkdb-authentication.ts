import { signIn, signOut, signUp, setJwtPayloadFunction } from '@zkdb/api';
import storage from '../storage/storage.js';
import { IStorage } from '../storage/interface/storage.js';
import { SignedData } from '../wallet/auro-wallet.js';

export abstract class BaseAuthenticator {
  constructor() {
    setJwtPayloadFunction(() => {
      const session = storage.getSession();
      const userInfo = storage.getUserInfo();
      if (session && userInfo) {
        return {
          sessionId: session.sessionId,
          sessionKey: session.sessionKey,
          userInfo,
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

    if (result.type === 'success') {
      this.getStorage().setSession({
        sessionId: result.data.session.sessionId,
        sessionKey: result.data.session.sessionKey,
      });

      this.getStorage().setUserInfo({
        email: result.data.user.email,
        userName: result.data.user.userName,
        publicKey: result.data.user.publicKey
      });
    } else {
      throw Error(result.message);
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

    if (result.type === 'error') {
      throw Error(result.message);
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
