import { Signer } from '../signer/interface/signer.js';
import { getSigner, setSigner } from '../signer/signer.js';
import { Authenticator } from '../authentication/authentication.js';
import { ZKDatabase } from '../interfaces/database.js';
import { MinaBlockchain } from '../interfaces/blockchain.js';
import { GlobalContext } from '../interfaces/global-context.js';
import { ZKDatabaseImpl } from '../impl/database.js';
import { MinaBlockchainImpl } from '../impl/blokchain.js';
import { GlobalContextImpl } from '../impl/global-context.js';
class ZKDatabaseClient {

  public get auth(): Authenticator {
    return new Authenticator(getSigner());
  }

  public setSigner(signer: Signer) {
    setSigner(signer);
  }

  database(name: string): ZKDatabase {
    return new ZKDatabaseImpl(name);
  }

  fromBlockchain(): MinaBlockchain {
    return new MinaBlockchainImpl();
  }

  fromGlobal(): GlobalContext {
    return new GlobalContextImpl();
  }
}

const zkdb = new ZKDatabaseClient();
export { zkdb };
