import { ApiClient, IApiClient } from '@zkdb/api';
import { Authenticator, ISecureStorage } from '../authentication';
import { ZKDatabase, GlobalContext } from '../interfaces';
import { ZKDatabaseImpl, GlobalContextImpl } from '../impl';

import { Signer } from '../signer';
import { NetworkId } from 'o1js';
import { Environment } from './environment';

export class ZKDatabaseClient {
  public apiClient: IApiClient;
  public authenticator: Authenticator;
  private environment: Environment;

  private constructor(
    apiClient: IApiClient,
    authenticator: Authenticator,
    environment: Environment
  ) {
    this.apiClient = apiClient;
    this.authenticator = authenticator;
    this.environment = environment;
  }

  public static newInstance(
    url: string,
    networkId: NetworkId,
    storage: ISecureStorage
  ) {
    const apiClient = ApiClient.newInstance(url);
    const environment = Environment.getInstance();
    environment.setEnv({
      networkId,
    });
    const authenticator = new Authenticator(apiClient, environment, storage);

    apiClient.api.setContext(() => authenticator.getAccessToken());
    return new ZKDatabaseClient(apiClient, authenticator, environment);
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
