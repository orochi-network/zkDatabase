/* eslint-disable no-unused-vars */
import { IApiClient, TSignInInfo } from '@zkdb/api';
import { AuroWalletSigner, NodeSigner } from '../signer';
import { PrivateKey } from 'o1js';
import { SignedData } from '../../types/signing';
import { Environment } from '../global/environment';
import { isBrowser } from '../../utils/environment';

export const ZKDB_KEY_ACCESS_TOKEN = 'accessToken';

export const ZKDB_KEY_USER_INFO = 'userInfo';

export interface ISecureStorage {
  set(key: string, value: string): void;
  get(key: string): string | undefined;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

export class Authenticator {
  #storage: ISecureStorage;

  private apiClient: IApiClient;

  private environment: Environment;

  constructor(
    apiClient: IApiClient,
    environment: Environment,
    storage: ISecureStorage = new Map<string, string>()
  ) {
    this.apiClient = apiClient;
    this.environment = environment;
    this.#storage = storage;
  }

  private get user() {
    return this.apiClient.user;
  }

  private timestamp() {
    return Math.floor(Date.now() / 1000);
  }

  isLoggedIn(): boolean {
    return typeof this.#storage.get(ZKDB_KEY_ACCESS_TOKEN) === 'string';
  }

  public async signIn(privateKey?: PrivateKey) {
    const ecdsa = (await this.user.ecdsa(undefined)).unwrap();

    let proof: SignedData;

    if (privateKey) {
      const { networkId } = this.environment.getEnv();
      proof = await NodeSigner.getInstance(networkId).signMessage(
        ecdsa,
        privateKey
      );
    } else if (isBrowser()) {
      proof = await AuroWalletSigner.getInstance().signMessage(ecdsa);
    } else {
      throw Error('Missed private key');
    }

    const userData = (await this.user.signIn({ proof })).unwrap();
    this.#storage.set(ZKDB_KEY_ACCESS_TOKEN, userData.accessToken);

    this.#storage.set(
      ZKDB_KEY_USER_INFO,
      JSON.stringify({
        userName: userData.userName,
        email: userData.email,
        publicKey: userData.publicKey,
      })
    );

    return userData;
  }

  public async signUp(
    userName: string,
    email: string,
    privateKey?: PrivateKey
  ) {
    let proof: SignedData;

    if (privateKey) {
      const { networkId } = this.environment.getEnv();
      proof = await NodeSigner.getInstance(networkId).signMessage(
        JSON.stringify({
          userName,
          email,
        }),
        privateKey
      );
    } else if (isBrowser()) {
      proof = await AuroWalletSigner.getInstance().signMessage(
        JSON.stringify({
          userName,
          email,
        })
      );
    } else {
      throw Error('Missed private key');
    }

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
    return JSON.parse(this.#storage.get(ZKDB_KEY_USER_INFO) || 'undefined');
  }

  public getAccessToken(): string | undefined {
    return this.#storage.get(ZKDB_KEY_ACCESS_TOKEN);
  }
}
