import { Signer } from '../signer/interface/signer.js';
import {
  Authenticator,
  ISecureStorage,
} from '../authentication/authentication.js';
import { ZKDatabase } from '../interfaces/database.js';
import { MinaBlockchain } from '../interfaces/blockchain.js';
import { GlobalContext } from '../interfaces/global-context.js';
import { ZKDatabaseImpl } from '../impl/database.js';
import { MinaBlockchainImpl } from '../impl/blokchain.js';
import { GlobalContextImpl } from '../impl/global-context.js';
import { ApiClient, IApiClient } from '@zkdb/api';

export class ZKDatabaseClient {
  public apiClient: IApiClient;

  public authenticator: Authenticator;

  private constructor(apiClient: IApiClient, authenticator: Authenticator) {
    this.apiClient = apiClient;
    this.authenticator = authenticator;
  }

  public static newInstance(
    url: string,
    signer: Signer,
    storage: ISecureStorage
  ) {
    const apiClient = ApiClient.newInstance(url);
    const authenticator = new Authenticator(signer, apiClient, storage);
    apiClient.api.setContext(() => authenticator.getAccessToken());
    return new ZKDatabaseClient(ApiClient.newInstance(url), authenticator);
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

  fromBlockchain(): MinaBlockchain {
    return new MinaBlockchainImpl(this);
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
