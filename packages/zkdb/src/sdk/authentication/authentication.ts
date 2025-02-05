import { IApiClient } from '@zkdb/api';
import { IMinaProvider, TUserSignInResponse } from '@zkdb/common';
import { InMemoryStorage } from '../storage/memory';

export const ZKDB_KEY_ACCESS_TOKEN = 'accessToken';

export const ZKDB_KEY_USER_INFO = 'userInfo';

export class Authenticator {
  #signer: IMinaProvider | undefined;

  // eslint-disable-next-line no-undef
  #storage: Storage;

  #userName: string;

  private apiClient: IApiClient;

  constructor(
    signer: IMinaProvider,
    apiClient: IApiClient,
    userName: string,
    // eslint-disable-next-line no-undef
    storage: Storage = new InMemoryStorage()
  ) {
    this.#signer = signer;
    this.apiClient = apiClient;
    this.#storage = storage;
    this.#userName = userName;
  }

  private get user() {
    return this.apiClient.user;
  }

  // eslint-disable-next-line class-methods-use-this
  private timestamp() {
    return Math.floor(Date.now() / 1000);
  }

  public get signer(): IMinaProvider {
    if (this.#signer) {
      return this.#signer;
    }
    throw new Error('Signer is not initialized');
  }

  public connect(signer: IMinaProvider) {
    this.#signer = signer;
  }

  isLoggedIn(): boolean {
    return typeof this.#storage.getItem(ZKDB_KEY_ACCESS_TOKEN) === 'string';
  }

  public async isUserExist(userName: string): Promise<boolean> {
    const { total } = (
      await this.apiClient.user.userFind({
        query: { userName },
        pagination: { limit: 10, offset: 0 },
      })
    ).unwrap();
    return typeof total === 'number' && total > 0;
  }

  public async signIn() {
    const ecdsaChallenge = (
      await this.user.userEcdsaChallenge(undefined)
    ).unwrap();
    const proof = await this.signer.signMessage({ message: ecdsaChallenge });
    if (proof instanceof Error) {
      throw proof;
    }
    const userData = (await this.user.userSignIn({ proof })).unwrap();
    this.#storage.setItem(ZKDB_KEY_ACCESS_TOKEN, userData.accessToken);

    this.#storage.setItem(
      ZKDB_KEY_USER_INFO,
      JSON.stringify({
        userName: userData.userName,
        email: userData.email,
        publicKey: userData.publicKey,
      })
    );

    return userData;
  }

  public async signUp(email: string) {
    const proof = await this.signer.signMessage({
      message: JSON.stringify({
        userName: this.#userName,
        email,
      }),
    });

    if (proof instanceof Error) {
      throw proof;
    }

    return (
      await this.user.userSignUp({
        proof,
        newUser: {
          userName: this.#userName,
          email,
          timestamp: this.timestamp(),
          userData: {},
        },
      })
    ).unwrap();
  }

  public async signOut(): Promise<void> {
    if ((await this.user.userSignOut(undefined)).unwrap()) {
      this.#storage.clear();
    }
  }

  public getUser():
    | Omit<TUserSignInResponse, 'userData' | 'accessToken'>
    | undefined {
    try {
      return JSON.parse(
        this.#storage.getItem(ZKDB_KEY_USER_INFO) || 'undefined'
      );
    } catch (_e) {
      return undefined;
    }
  }

  public getAccessToken(): string | undefined {
    return this.#storage.getItem(ZKDB_KEY_ACCESS_TOKEN) || undefined;
  }
}
