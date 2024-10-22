import { ApiClient, IApiClient } from '@zkdb/api';
import { Authenticator, ISecureStorage } from '../authentication';
import { ZKDatabase, MinaBlockchain, GlobalContext } from '../interfaces';
import { ZKDatabaseImpl, MinaBlockchainImpl, GlobalContextImpl } from '../impl';
import { Signer } from '../signer';
import { NetworkId } from '../../types/network';

export class ZKDatabaseClient {
  public apiClient: IApiClient;
  public authenticator: Authenticator;
  private networkId: NetworkId

  private constructor(apiClient: IApiClient, authenticator: Authenticator, networkId: NetworkId) {
    this.apiClient = apiClient;
    this.authenticator = authenticator;
    this.networkId = networkId;
  }

  public static newInstance(
    url: string,
    signer: Signer,
    storage: ISecureStorage,
    networkId: NetworkId
  ) {
    const apiClient = ApiClient.newInstance(url);
    const authenticator = new Authenticator(signer, apiClient, storage, networkId);
    apiClient.api.setContext(() => authenticator.getAccessToken());
    return new ZKDatabaseClient(apiClient, authenticator, networkId);
  }

  public getSigner(): Signer {
    return this.authenticator.signer;
  }

  public setSigner(signer: Signer) {
    this.authenticator.connect(signer);
  }

  database(name: string): ZKDatabase {
    if (this.apiClient) {
      return new ZKDatabaseImpl(name, this.apiClient, this.networkId);
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
      return new GlobalContextImpl(this.apiClient, this.networkId);
    }

    throw new Error(
      'Global access failed: Server URL is not set. Please call connect() first.'
    );
  }
}

export default ZKDatabaseClient;
