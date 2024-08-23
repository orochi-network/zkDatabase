import { ZKDatabaseContext } from '../interfaces/context.js';
import { ZKDatabase } from '../interfaces/database.js';
import { ZKDatabaseImpl } from './database.js';
import { MinaBlockchain } from '../interfaces/blockchain.js';
import { MinaBlockchainImpl } from './blokchain.js';
import { GlobalContextImpl } from './global-context.js';
import { GlobalContext } from '../interfaces/global-context.js';

export class ZKDatabaseContextImpl implements ZKDatabaseContext {
  database(name: string): ZKDatabase {
    return new ZKDatabaseImpl(name);
  }

  minaBlockchain(): MinaBlockchain {
    return new MinaBlockchainImpl();
  }

  global(): GlobalContext {
    return new GlobalContextImpl();
  }
}
