import { signIn, signOut, signUp, setJwtPayloadFunction } from '@zkdb/api';
import storage from '../storage/storage.js';
import { SignedData } from '../../types/signing.js';
import { Signer } from '../signer/interface/signer.js';
import { ZKDatabaseUser } from '../types/zkdatabase-user.js';

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

  async signIn(email: string) {
    const signInProof = await this.getSigner().signMessage(
      JSON.stringify({
        email,
        timestamp: Math.floor(Date.now() / 1000),
      })
    );

    await this.sendLoginRequest(email, signInProof);
  }

  async signUp(userName: string, email: string) {
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

    if (result.isOne()) {
      const userData = result.unwrapObject();

      storage.setSession({
        sessionId: userData.session.sessionId,
        sessionKey: userData.session.sessionKey,
      });

      storage.setUserInfo({
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

    if (result.isError()) {
      throw result.unwrapError()
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut();
    } finally {
      storage.clear();
    }
  }

  public getUser(): ZKDatabaseUser | null {
    const userInfo = storage.getUserInfo();

    if (userInfo) {
      const { userName: name, email, publicKey } = userInfo;
      return { name, email, publicKey };
    }

    return null;
  }

  private getSigner(): Signer {
    if (this.signer === undefined) {
      throw Error('Signer was not set. Call ZKDatabaseClient.setSigner first')
    }

    return this.signer;
  }
}
