import storage from '../storage/storage.js';
import { ZKDatabaseUser } from '../types/zkdatabase-user.js';
import { Signer } from '../signer/interface/signer.js';
import { getSigner, setSigner } from '../signer/signer.js';
import { Authenticator } from '../authentication/authentication.js';
import { ZKDatabaseContext } from '../query/interfaces/context.js';
import { ZKDatabaseContextImpl } from '../query/impl/context.js';

export class ZKDatabaseClient {
  static auth(): Authenticator {
    return new Authenticator(getSigner());
  }

  static setSigner(signer: Signer) {
    setSigner(signer);
  }

  static get currentUser(): ZKDatabaseUser | null {
    const userInfo = storage.getUserInfo();

    if (userInfo) {
      const { userName: name, email, publicKey } = userInfo;
      return { name, email, publicKey };
    }

    return null;
  }

  static get context(): ZKDatabaseContext {
    return new ZKDatabaseContextImpl();
  }
}
