import { Signer } from '../signer/interface/signer.js';
import { getSigner, setSigner } from '../signer/signer.js';
import { Authenticator } from '../authentication/authentication.js';
import { ZKDatabase } from '../interfaces/database.js';
import { MinaBlockchain } from '../interfaces/blockchain.js';
import { GlobalContext } from '../interfaces/global-context.js';
import { ZKDatabaseImpl } from '../impl/database.js';
import { MinaBlockchainImpl } from '../impl/blokchain.js';
import { GlobalContextImpl } from '../impl/global-context.js';
import { ApiClient, IApiClient } from '@zkdb/api';
import storage from '../../storage/storage.js';

class ZKDatabaseClient {
  private apiClient: IApiClient<any>;

  public connect(url: string, signer: Signer) {
    this.initializeApiClient(url);
    this.setSigner(signer);
  }

  private initializeApiClient(url: string) {
    this.apiClient = ApiClient.newInstance(url);
    this.apiClient.api.setContext(() => {
      return storage.getAccessToken();
    });
  }

  public get auth(): Authenticator {
    if (this.apiClient) {
      return new Authenticator(getSigner(), this.apiClient);
    }
    throw new Error(
      'Authentication failed: Server URL is not set. Please call connect() first.'
    );
  }

  public setSigner(signer: Signer) {
    setSigner(signer);
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
    return new MinaBlockchainImpl();
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

const zkdb = new ZKDatabaseClient();

export { zkdb };
