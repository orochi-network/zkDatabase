import { IApiClient } from '@zkdb/api';
import { PrivateKey } from 'o1js';
import { Environment } from '../global/environment';
import { AuthenticationTransaction } from './authentication-transaction';
import { isBrowser } from '@utils';
import { AuroWalletSigner, NodeSigner } from '../signer';
import { SignedData } from '@types';
import { ZKDB_KEY_ACCESS_TOKEN, ZKDB_KEY_USER_INFO } from './authentication';

export class SignInTransaction implements AuthenticationTransaction {
  private apiClient: IApiClient;
  private environment: Environment;
  #storage: Storage;
  private ecdsa: string;

  constructor(
    apiClient: IApiClient,
    storage: Storage,
    environment: Environment,
    ecdsa: string
  ) {
    this.apiClient = apiClient;
    this.#storage = storage;
    this.ecdsa = ecdsa;
    this.environment = environment;
  }

  async signAndSend(privateKey?: PrivateKey) {
    let proof: SignedData;

    if (privateKey) {
      const { networkId } = this.environment.getEnv();
      proof = await NodeSigner.getInstance(networkId).signMessage(
        this.ecdsa,
        privateKey
      );
    } else if (isBrowser()) {
      proof = await AuroWalletSigner.getInstance().signMessage(this.ecdsa);
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
  }

  private get user() {
    return this.apiClient.user;
  }
}
