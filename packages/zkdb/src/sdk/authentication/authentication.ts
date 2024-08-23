import { signIn, signOut, signUp, setJwtPayloadFunction } from '@zkdb/api';
import storage from '../storage/storage.js';
import { SignedData } from '../../types/signing.js';
import { Signer } from '../signer/interface/signer.js';

export class Authenticator {
  private signer: Signer;

  constructor(signer: Signer) {
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

    this.signer = signer;
  }

  isLoggedIn(): boolean {
    return storage.getSession() !== null;
  }

  async login(email: string) {
    const signInProof = await this.getSigner().signMessage(
      JSON.stringify({
        email,
        timestamp: Math.floor(Date.now() / 1000),
      })
    );

    await this.sendLoginRequest(email, signInProof);
  }

  async register(userName: string, email: string) {
    const signUpProof = await this.getSigner().signMessage(
      JSON.stringify({
        userName,
        email,
      })
    );

    await this.sendRegistrationRequest(email, userName, signUpProof)
  }

  private async sendLoginRequest(email: string, proof: SignedData) {
    const result = await signIn(email, proof);

    if (result.type === 'success') {
      storage.setSession({
        sessionId: result.data.session.sessionId,
        sessionKey: result.data.session.sessionKey,
      });

      storage.setUserInfo({
        email: result.data.user.email,
        userName: result.data.user.userName,
        publicKey: result.data.user.publicKey,
      });
    } else {
      throw Error(result.message);
    }
  }

  private async sendRegistrationRequest(
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

  async logOut(): Promise<void> {
    try {
      await signOut();
    } finally {
      storage.clear();
    }
  }

  private getSigner(): Signer {
    if (this.signer === undefined) {
      throw Error('Signer was not set. Call ZKDatabaseClient.setSigner first')
    }

    return this.signer;
  }
}
