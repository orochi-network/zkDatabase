/* eslint-disable no-unused-vars */
import { IApiClient, TSignInInfo } from '@zkdb/api';
import { Signer } from '../signer';
import InMemoryStorage from '../storage/memory';

export const ZKDB_KEY_ACCESS_TOKEN = 'accessToken';

export const ZKDB_KEY_USER_INFO = 'userInfo';

export class Authenticator {
  #signer: Signer | undefined;

  #storage: Storage;

  private apiClient: IApiClient;

  constructor(
    signer: Signer,
    apiClient: IApiClient,
    storage: Storage = new InMemoryStorage()
  ) {
    this.#signer = signer;
    this.apiClient = apiClient;
    this.#storage = storage;
  }

  private get user() {
    return this.apiClient.user;
  }

  private timestamp() {
    return Math.floor(Date.now() / 1000);
  }

  public get signer(): Signer {
    if (this.#signer) {
      return this.#signer;
    }
    throw new Error('Signer is not initialized');
  }

  public connect(signer: Signer) {
    this.#signer = signer;
  }

  isLoggedIn(): boolean {
    return typeof this.#storage.getItem(ZKDB_KEY_ACCESS_TOKEN) === 'string';
  }

  public async signIn() {
    const ecdsa = (await this.user.ecdsa(undefined)).unwrap();
    const proof = await this.signer.signMessage(ecdsa);
    const userData = (await this.user.signIn({ proof })).unwrap();
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

  public async signUp(userName: string, email: string) {
    const proof = await this.signer.signMessage(
      JSON.stringify({
        userName,
        email,
      })
    );

    return (
      await this.user.signUp({
        proof,
        signUp: {
          userName,
          email,
          timestamp: this.timestamp(),
          userData: {},
        },
      })
    ).unwrap();
  }

  public async signOut(): Promise<void> {
    if ((await this.user.signOut(undefined)).unwrap()) {
      this.#storage.clear();
    }
  }

  public getUser(): Omit<TSignInInfo, 'userData' | 'accessToken'> | undefined {
    try {
      return JSON.parse(
        this.#storage.getItem(ZKDB_KEY_USER_INFO) || 'undefined'
      );
    } catch (e) {
      return undefined;
    }
  }

  public getAccessToken(): string | undefined {
    return this.#storage.getItem(ZKDB_KEY_ACCESS_TOKEN) || undefined;
  }
}