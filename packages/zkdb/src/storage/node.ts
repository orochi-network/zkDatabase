import { IStorage } from './interface/storage.js';
import { UserInfo } from './types/user.js';

export class NodeStorage implements IStorage {
  private accessToken: string | null;
  private userInfo: UserInfo | null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  getUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  setUserInfo(userInfo: UserInfo) {
    this.userInfo = userInfo;
  }

  clear(): void {
    this.accessToken = null;
    this.userInfo = null;
  }
}
