import { IApiClient } from '@zkdb/api';
import storage from '../../storage/storage.js';
import { SignedData } from '../../types/signing.js';
import { Signer } from '../signer/interface/signer.js';
import { ZKDatabaseUser } from '../types/zkdatabase-user.js';

export class Authenticator {
  #signer: Signer;
  private apiClient: IApiClient;

  constructor(signer: Signer, apiClient: IApiClient) {
    this.#signer = signer;
    this.apiClient = apiClient;
  }

  isLoggedIn(): boolean {
    return storage.getAccessToken() !== null;
  }

  async signIn() {
    const ecdsaResult = await this.user.ecdsa(undefined);

    const ecdsaMessage = ecdsaResult.unwrap();

    const signInProof = await this.signer.signMessage(ecdsaMessage);

    await this.sendLoginRequest(signInProof);
  }

  async signUp(userName: string, email: string) {
    const signUpProof = await this.signer.signMessage(
      JSON.stringify({
        userName,
        email,
      })
    );

    await this.sendRegistrationRequest(email, userName, signUpProof);
  }

  private async sendLoginRequest(proof: SignedData) {
    const result = await this.user.signIn({ proof });

    const userData = result.unwrap();

    storage.setAccessToken(userData.accessToken);

    storage.setUserInfo({
      email: userData.email,
      userName: userData.userName,
      publicKey: userData.publicKey,
    });
  }

  private async sendRegistrationRequest(
    email: string,
    userName: string,
    proof: SignedData
  ) {
    const result = await this.user.signUp({
      proof,
      signUp: {
        userName,
        email,
        timestamp: Math.floor(Date.now() / 1000),
        userData: {},
      },
    });

    return result.unwrap();
  }

  async signOut(): Promise<void> {
    try {
      await this.user.signOut(undefined);
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

  private get signer() {
    return this.#signer;
  }

  private get user() {
    return this.apiClient.user;
  }
}
