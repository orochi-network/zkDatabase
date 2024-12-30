import { isBrowser, isNetwork } from '@utils';
import { ApiClient, IApiClient } from '@zkdb/api';
import { ENetworkId } from '@zkdb/common';
import { NetworkId, PrivateKey } from 'o1js';
import { Authenticator } from '../authentication';
import { Database } from '../implement';
import { IDatabase } from '../interfaces';
import { AuroWalletSigner, NodeSigner, Signer } from '../signer';
import InMemoryStorage from '../storage/memory';

type MinaConfig = {
  networkUrl: string;
  networkId: NetworkId;
};

/**
 * The ZKDatabase Client class provides methods to interact with the ZKDatabase.
 * It allows connecting to the database using different authentication methods
 * and provides access to database and system functionalities.
 */
export class ZKDatabase {
  public apiClient: IApiClient;

  public authenticator: Authenticator;

  public minaConfig: MinaConfig;

  private constructor(
    apiClient: IApiClient,
    authenticator: Authenticator,
    minaConfig: MinaConfig
  ) {
    this.apiClient = apiClient;
    this.authenticator = authenticator;
    this.minaConfig = minaConfig;
  }

  /**
   * Create new instance of ZKDatabaseClient by url
   * Connect from NodeJS using a private key
   * ```ts
   * const client = await ZKDatabaseClient.connect('zkdb+https://username:EKEGu8rTZbfWE1HWLxWtDnjt8gchvGxYM4s5q3KvNRRfdHBVe6UU@test-serverless.zkdatabase.org/graphql?db=my-db');
   * ```
   * Connect from browser using Auro Wallet
   * ```ts
   * const client = await ZKDatabaseClient.connect('zkdb+https://username@test-serverless.zkdatabase.org/graphql?db=my-db');
   * ```
   * @param url
   * @returns
   */
  public static async connect(url: string): Promise<ZKDatabase> {
    const urlInstance = new URL(url);
    const { password, protocol, host, pathname } = urlInstance;
    const [abstract] = protocol.replace(':', '').split('+');
    const apiURL = `${abstract}://${host}${pathname}`;
    const tmpClient = ApiClient.newInstance(apiURL, globalThis.localStorage);

    // Get environment variables
    const { networkId, networkUrl } = (
      await tmpClient.db.dbEnvironment()
    ).unwrap();

    if (isBrowser() && isNetwork(networkId) && typeof networkUrl === 'string') {
      // Browser environment
      if (password === '' || password === 'auro-wallet') {
        const apiClient = ApiClient.newInstance(
          apiURL,
          globalThis.localStorage
        );
        const signer = new AuroWalletSigner();
        const authenticator = new Authenticator(
          signer,
          apiClient,
          globalThis.localStorage
        );
        return new ZKDatabase(apiClient, authenticator, {
          networkId: networkId === ENetworkId.Mainnet ? 'mainnet' : 'testnet',
          networkUrl,
        });
      }
    } else {
      // Nodejs environment
      const storage = new InMemoryStorage();
      const apiClient = ApiClient.newInstance(apiURL, storage);
      const signer = new NodeSigner(
        PrivateKey.fromBase58(password),
        networkId === ENetworkId.Mainnet ? 'mainnet' : 'testnet'
      );
      return new ZKDatabase(
        apiClient,
        new Authenticator(signer, apiClient, storage),
        {
          networkId: networkId === ENetworkId.Mainnet ? 'mainnet' : 'testnet',
          networkUrl,
        }
      );
    }
    throw new Error('Invalid environment');
  }

  /**
   * Retrieves the current signer associated with the authenticator.
   *
   * @returns {Signer} The signer instance used for authentication.
   */
  public getSigner(): Signer {
    return this.authenticator.signer;
  }

  /**
   * Sets the signer for the authenticator.
   *
   * @param signer - The signer to be connected to the authenticator.
   */
  public setSigner(signer: Signer) {
    this.authenticator.connect(signer);
  }

  /**
   * Retrieves an instance of `ZKDatabase` with the specified name.
   *
   * @param name - The name of the database to access.
   * @returns An instance of `ZKDatabase`.
   * @throws Will throw an error if the server URL is not set and `connect()` has not been called.
   */
  db(databaseName: string): IDatabase {
    if (this.apiClient) {
      return new Database(this.apiClient, databaseName);
    }
    throw new Error(
      'Database access failed: Server URL is not set. Please call connect() first.'
    );
  }
}

export default ZKDatabase;
