import { ZKDatabase } from '../interfaces/database.js';
import { ZKDatabaseContext } from '../interfaces/context.js';
import { GlobalContext } from '../interfaces/global-context.js';
import { ZKDatabaseImpl } from './database-query.js';
import { GlobalContextImpl } from './global-context.js';
import { MinaBlockchain } from '../interfaces/blockchain.js';
import { MinaBlockchainImpl } from './blokchain.js';

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
