import { AppContainer } from 'src/container.js';
import storage from '../../storage/storage.js';
import { SignedData } from '../../types/signing.js';
import { Signer } from '../signer/interface/signer.js';
import { ZKDatabaseUser } from '../types/zkdatabase-user.js';

export class Authenticator {
  private signer: Signer;

  constructor(signer: Signer) {
    this.signer = signer;
  }

  isLoggedIn(): boolean {
    return storage.getAccessToken() !== null;
  }

  async signIn() {
    const ecdsaResult = await AppContainer.getInstance()
      .getApiClient()
      .user.ecdsa(undefined);

    const ecdsaMessage = ecdsaResult.unwrap();

    const signInProof = await this.getSigner().signMessage(
      JSON.stringify({
        ecdsaMessage,
        timestamp: Math.floor(Date.now() / 1000),
      })
    );

    await this.sendLoginRequest(signInProof);
  }

  async signUp(userName: string, email: string) {
    const signUpProof = await this.getSigner().signMessage(
      JSON.stringify({
        userName,
        email,
      })
    );

    await this.sendRegistrationRequest(email, userName, signUpProof);
  }

  private async sendLoginRequest(proof: SignedData) {
    const result = await AppContainer.getInstance()
      .getApiClient()
      .user.signIn({ proof });

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
    const result = await AppContainer.getInstance()
      .getApiClient()
      .user.signUp({
        proof,
        signUp: {
          ...{
            userName,
            email,
          },
          timestamp: Math.floor(Date.now() / 1000),
          userData: {},
        },
      });

    return result.unwrap();
  }

  async signOut(): Promise<void> {
    try {
      await AppContainer.getInstance().getApiClient().user.signOut(undefined);
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
      throw Error('Signer was not set. Call ZKDatabaseClient.setSigner first');
    }

    return this.signer;
  }
}
