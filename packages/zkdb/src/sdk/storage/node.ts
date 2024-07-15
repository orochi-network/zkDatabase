import { IStorage } from './interface/storage.js';
import { Session } from './types/session.js';
import { UserInfo } from './types/user.js';

export class NodeStorage implements IStorage {
  private session: Session | null;
  private userInfo: UserInfo | null;

  getSession(): Session | null {
    return this.session;
  }

  setSession(session: Session) {
    this.session = session;
  }

  getUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  setUserInfo(userInfo: UserInfo) {
    this.userInfo = userInfo;
  }

  clear(): void {
    this.session = null;
    this.userInfo = null;
  }
}
