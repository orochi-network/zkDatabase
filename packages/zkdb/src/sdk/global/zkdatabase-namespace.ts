import { PrivateKey } from 'o1js';
import { ZKDatabaseImpl } from '../database.js';
import { ZKDatabase } from '../interfaces/database.js';
import storage from '../storage/storage.js';
import { ZKDatabaseUser } from '../types/zkdatabase-user.js';
import { NodeAuthenticator } from '../authentication/node-authentication.js';
import { BrowserAuthenticator } from '../authentication/browser-authentication.js';

export class ZKDatabaseClient {

  static basicAuth(): NodeAuthenticator {
    return NodeAuthenticator.getInstance();
  }

  static browserAuth(): BrowserAuthenticator {
    return BrowserAuthenticator.getInstance();
  }

  static get currentUser(): ZKDatabaseUser | null {
    const userInfo = storage.getUserInfo();

    if (userInfo) {
      const { userName: name, email } = userInfo;
      return { name, email };
    }

    return null;
  }

  static async createDatabase(
    name: string,
    merkleHeight: number,
    signerPrivateKey: PrivateKey
  ) {
    return ZKDatabaseImpl.create(name, merkleHeight, signerPrivateKey);
  }

  static async connectDatabase(name: string): Promise<ZKDatabase> {
    const settings = await ZKDatabaseImpl.getDatabaseSettings(name);
    if (settings) {
      return new ZKDatabaseImpl(
        name,
        settings.merkleHeight,
        settings.publicKey
      );
    }

    throw Error(`Database ${name} does not exist`);
  }
}
