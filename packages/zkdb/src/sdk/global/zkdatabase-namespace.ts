import { PrivateKey, PublicKey } from 'o1js';
import { ZKDatabaseImpl } from '../database.js';
import { ZKDatabase } from '../interfaces/database.js';
import storage from '../storage/storage.js';
import { ZKDatabaseUser } from '../types/zkdatabase-user.js';
import { NodeAuthenticator } from '../authentication/node-authentication.js';
import { BrowserAuthenticator } from '../authentication/browser-authentication.js';
import { Signer } from '../signer/interface/signer.js';
import { setSigner } from '../signer/signer.js';
import { DatabaseContractWrapper } from '../smart-contract/database-contract-wrapper.js';

export class ZKDatabaseClient {
  static basicAuth(): NodeAuthenticator {
    return NodeAuthenticator.getInstance();
  }

  static browserAuth(): BrowserAuthenticator {
    return BrowserAuthenticator.getInstance();
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

  static async createDatabase(
    name: string,
    merkleHeight: number,
    appKey: PrivateKey
  ) {
    const user = ZKDatabaseClient.currentUser;

    if (user) {
      return ZKDatabaseImpl.create(name, merkleHeight, PublicKey.fromBase58(user.publicKey), appKey);
    }

    throw Error('User has not been found.')
  }

  static async connectDatabase(name: string): Promise<ZKDatabase> {
    const currUser = ZKDatabaseClient.currentUser;

    if (currUser) {
      const settings = await ZKDatabaseImpl.getDatabaseSettings(name);
      if (settings) {
        const databaseSmartContract = DatabaseContractWrapper.getInstance(
          name,
          settings.merkleHeight,
          PublicKey.fromBase58(currUser.publicKey),
          PublicKey.fromBase58(settings.publicKey)
        );

        return new ZKDatabaseImpl(
          name,
          settings.merkleHeight,
          PublicKey.fromBase58(settings.publicKey),
          databaseSmartContract
        );
      }

      throw Error(`Database ${name} does not exist`);
    }
    throw Error('User unauthorized');
  }
}
