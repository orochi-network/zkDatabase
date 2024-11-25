import { ApiClient, IApiClient } from '@zkdb/api';
import { Authenticator } from '../authentication';
import { ZKDatabase, GlobalContext } from '../interfaces';
import { ZKDatabaseImpl, GlobalContextImpl } from '../impl';

import { AuroWalletSigner, NodeSigner, Signer } from '../signer';
import { PrivateKey } from 'o1js';

export class ZKDatabaseClient {
  public apiClient: IApiClient;

  public authenticator: Authenticator;

  public minaRPC: string;

  private constructor(
    apiClient: IApiClient,
    authenticator: Authenticator,
    minaRPC: string
  ) {
    this.apiClient = apiClient;
    this.authenticator = authenticator;
    this.minaRPC = minaRPC;
  }

  /**
   * Create new instance of ZKDatabaseClient by url
   * Connect from NodeJS using a private key
   * ```ts
   * const client = await ZKDatabaseClient.connect('zzkdb+https://username@EKEGu8rTZbfWE1HWLxWtDnjt8gchvGxYM4s5q3KvNRRfdHBVe6UU:test-serverless.zkdatabase.org/graphql?db=my-db');
   * ```
   * Connect from browser using Auro Wallet
   * ```ts
   * const client = await ZKDatabaseClient.connect('zzkdb+https://username@test-serverless.zkdatabase.org/graphql?db=my-db');
   * ```
   * @param url
   * @returns
   */
  public static async connec(url: string): Promise<ZKDatabaseClient> {
    const urlInstance = new URL(url);
    const { username, password, protocol, hostname, pathname, searchParams } =
      urlInstance;
    const [base, abstract] = protocol.replace(':', '').split('+');
    if (base != 'zkdb') {
      throw new Error('Invalid protocol');
    }
    const apiURL = `${abstract}://${hostname}/${pathname}`;
    const db = searchParams.get('db');
    if (!db) {
      throw new Error('Database name is required');
    }
    const apiClient = ApiClient.newInstance(apiURL);
    // Get envrionment variable
    const envResult = await apiClient.environment.getEnvironment(undefined);
    const { networkId, networkUrl } = envResult.isOne()
      ? envResult.unwrap()
      : {};
    if (typeof networkId === 'string' && typeof networkUrl === 'string') {
      if (password === '' || password === 'auro-wallet') {
        const signer = new AuroWalletSigner();
        const authenticator = new Authenticator(
          signer,
          apiClient,
          global.localStorage
        );
        return new ZKDatabaseClient(apiClient, authenticator, networkUrl);
      } else {
        const signer = new NodeSigner(
          PrivateKey.fromBase58(password),
          networkId
        );
        return new ZKDatabaseClient(
          apiClient,
          new Authenticator(signer, apiClient),
          networkUrl
        );
      }
    }
    throw new Error('Invalid environment');
  }

  public getSigner(): Signer {
    return this.authenticator.signer;
  }

  public setSigner(signer: Signer) {
    this.authenticator.connect(signer);
  }

  database(name: string): ZKDatabase {
    if (this.apiClient) {
      return new ZKDatabaseImpl(name, this.apiClient);
    }
    throw new Error(
      'Database access failed: Server URL is not set. Please call connect() first.'
    );
  }

  fromGlobal(): GlobalContext {
    if (this.apiClient) {
      return new GlobalContextImpl(this.apiClient);
    }

    throw new Error(
      'Global access failed: Server URL is not set. Please call connect() first.'
    );
  }
}

export default ZKDatabaseClient;
