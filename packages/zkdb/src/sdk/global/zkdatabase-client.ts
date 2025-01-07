import { isBrowser, isNetwork } from '@utils';
import { ApiClient, IApiClient } from '@zkdb/api';
import { ENetworkId } from '@zkdb/common';
import { NetworkId, PrivateKey } from 'o1js';
import { Authenticator } from '../authentication';
import { Database } from '../implement';
import { IDatabase } from '../interfaces';
import { MinaProvider, NodeProvider, IMinaProvider } from '@zkdb/common';
import InMemoryStorage from '../storage/memory';

type MinaConfig = {
  networkUrl: string;
  networkId: NetworkId;
};

type ZKDatabaseConfig =
  | {
      userName: string;
      environment: 'browser';
      url: string;
    }
  | {
      userName: string;
      privateKey: string;
      environment: 'node';
      url: string;
    };

/**
 * The ZkDatabase Client class provides methods to interact with the ZkDatabase.
 * It allows connecting to the database using different authentication methods
 * and provides access to database and system functionalities.
 */
export class ZkDatabase {
  private apiClient: IApiClient;

  public auth: Authenticator;

  public mina: MinaConfig;

  private constructor(
    apiClient: IApiClient,
    authenticator: Authenticator,
    minaConfig: MinaConfig
  ) {
    this.apiClient = apiClient;
    this.auth = authenticator;
    this.mina = minaConfig;
  }

  private static parseConfig(
    config: string | ZKDatabaseConfig
  ): ZKDatabaseConfig {
    if (typeof config === 'string') {
      const urlInstance = new URL(config);
      const {
        password: privateKey,
        username: userName,
        protocol,
        host,
        pathname,
      } = urlInstance;
      const [_, abstract] = protocol.replace(':', '').split('+');
      const apiURL = `${abstract}://${host}${pathname}`;
      return typeof privateKey === 'string' && privateKey.length > 0
        ? {
            userName,
            environment: 'node',
            privateKey,
            url: apiURL,
          }
        : {
            userName,
            environment: 'browser',
            url: apiURL,
          };
    } else if (typeof config === 'object') {
      return config;
    }
    throw new Error(
      'Invalid configuration type. Expected string or ZKDatabaseConfig.'
    );
  }

  /**
   * Create new instance of ZKDatabase by url
   * Connect from NodeJS using a private key
   *```ts
   * const client = await ZKDatabase.connect('zkdb+https://username:EKEGu8rTZbfWE1HWLxWtDnjt8gchvGxYM4s5q3KvNRRfdHBVe6UU@test-serverless.zkdatabase.org/graphql');
   *```
   * Connect from browser using Auro Wallet
   *```ts
   * const client = await ZKDatabase.connect('zkdb+https://username@test-serverless.zkdatabase.org/graphql');
   *```
   * @param url
   * @returns
   */
  public static async connect(url: string): Promise<ZkDatabase>;

  /**
   * Create new instance of ZKDatabase by config object
   * Connect from NodeJS using a private key
   *```ts
   * const client = await ZKDatabase.connect({
   *  userName: 'username',
   *  environment: 'node',
   *  privateKey: 'EKEGu8rTZbfWE1HWLxWtDnjt8gchvGxYM4s5q3KvNRRfdHBVe6UU',
   *  url: 'https://test-serverless.zkdatabase.org/graphql',
   * });
   *```
   * Connect from NodeJS using Auro Wallet
   *```ts
   * const client = await ZKDatabase.connect({
   *  userName: 'username',
   *  environment: 'browser',
   *  url: 'https://test-serverless.zkdatabase.org/graphql',
   * });
   *```
   * @param config
   */
  public static async connect(config: ZKDatabaseConfig): Promise<ZkDatabase>;

  public static async connect(
    config: string | ZKDatabaseConfig
  ): Promise<ZkDatabase> {
    const cfg = ZkDatabase.parseConfig(config);
    const tmpClient = ApiClient.newInstance(cfg.url, new InMemoryStorage());

    // Get environment variables
    const { networkId: networkEnum, networkUrl } = (
      await tmpClient.db.dbEnvironment()
    ).unwrap();
    const networkId =
      networkEnum === ENetworkId.Mainnet ? 'mainnet' : 'testnet';

    if (isBrowser() && isNetwork(networkId) && typeof networkUrl === 'string') {
      // Browser environment
      if (cfg.environment === 'browser') {
        const apiClient = ApiClient.newInstance(
          cfg.url,
          globalThis.localStorage
        );
        const signer = new MinaProvider();
        const authenticator = new Authenticator(
          signer,
          apiClient,
          cfg.userName,
          globalThis.localStorage
        );
        return new ZkDatabase(apiClient, authenticator, {
          networkId,
          networkUrl,
        });
      }
    } else if (cfg.environment === 'node') {
      // Nodejs environment
      const storage = new InMemoryStorage();
      const apiClient = ApiClient.newInstance(cfg.url, storage);
      const signer = new NodeProvider(
        PrivateKey.fromBase58(cfg.privateKey),
        networkId
      );
      return new ZkDatabase(
        apiClient,
        new Authenticator(signer, apiClient, cfg.userName, storage),
        {
          networkId: networkId,
          networkUrl,
        }
      );
    }
    throw new Error('Invalid environment');
  }

  /**
   * Retrieves an instance of `ZKDatabase` with the specified name.
   *
   * @param name - The name of the database to access.
   * @returns An instance of `ZkDatabase`.
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

export default ZkDatabase;
