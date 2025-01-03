/* eslint-disable no-unused-vars */
import { IApiClient } from '@zkdb/api';
import { Signer } from '../signer';
import InMemoryStorage from '../storage/memory';
import { TUserSignInResponse } from '@zkdb/common';

export const ZKDB_KEY_ACCESS_TOKEN = 'accessToken';

export const ZKDB_KEY_USER_INFO = 'userInfo';

export class Authenticator {
  #signer: Signer | undefined;

  #storage: Storage;

  #userName: string;

  private apiClient: IApiClient;

  constructor(
    signer: Signer,
    apiClient: IApiClient,
    userName: string,
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
    const ecdsa = (await this.user.userEcdsaChallenge()).unwrap();
    const proof = await this.signer.signMessage(ecdsa);
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
    const proof = await this.signer.signMessage(
      JSON.stringify({
        userName: this.#userName,
        email,
      })
    );

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
    if ((await this.user.userSignOut()).unwrap()) {
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
    } catch (e) {
      return undefined;
    }
  }

  public getAccessToken(): string | undefined {
    return this.#storage.getItem(ZKDB_KEY_ACCESS_TOKEN) || undefined;
  }
}
