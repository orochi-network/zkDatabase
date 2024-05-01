import Client from 'mina-signer';
import { UserInfo } from '../types/user.js';
import { signIn, signOut, signUp } from '../client/index.js';
import LocalStorage from '../storage/local-storage.js';

export default class AuthService {
  private client: Client;

  constructor() {
    this.client = new Client({ network: 'testnet' });
  }

  async signIn(email: string, privateKey: string): Promise<boolean> {
    const signInProof = this.client.signMessage(
      JSON.stringify({
        email,
        timestamp: Math.floor(Date.now() / 1000),
      }),
      privateKey
    );

    const response = await signIn(signInProof);

    if (response.success) {
      LocalStorage.getInstance().setSession({
        sessionId: response.sessionId,
        sessionKey: response.sessionKey,
      });
      LocalStorage.getInstance().setUserInfo({
        email: email,
        userName: response.userName,
      });
      return true;
    }

    return false;
  }

  async signUp(userInfo: UserInfo, privateKey: string): Promise<boolean> {
    const signUpProof = this.client.signMessage(
      JSON.stringify(userInfo),
      privateKey
    );

    const response = await signUp(signUpProof, {
      ...userInfo,
      timestamp: Math.floor(Date.now() / 1000),
      userData: {},
    });

    return response.success;
  }

  async logOut(): Promise<boolean> {
    const response = await signOut();
    if (response.success) {
      LocalStorage.getInstance().setSession(undefined);
      LocalStorage.getInstance().setUserInfo(undefined);
    }

    return response.success;
  }

  public isAuthorized(): boolean {
    return LocalStorage.getInstance().getSession() !== undefined;
  }
}
