import { listDatabases } from '../client/index.js';
import { PrivateKey } from 'o1js';
import AuthService from './authentication.js';
import { UserInfo } from '../types/user.js';
import { Database } from './database.js';

export class ZKDatabaseStorage {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  public async signIn(email: string, privateKey: PrivateKey): Promise<boolean> {
    return this.authService.signIn(email, privateKey.toBase58());
  }

  public async signUp(
    userInfo: UserInfo,
    privateKey: PrivateKey
  ): Promise<boolean> {
    return this.authService.signUp(userInfo, privateKey.toBase58());
  }

  public async logOut(): Promise<boolean> {
    if (!this.authService.isAuthorized()) {
      return false;
    }

    return this.authService.logOut();
  }

  public database(name: string): Database {
    return new Database(name);
  }

  public async listDatabases() {
    return (await listDatabases()).databases;
  }
}
