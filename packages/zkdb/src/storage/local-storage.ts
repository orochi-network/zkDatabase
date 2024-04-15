import { UserInfo } from '../types/user.js';
import { Storage, SESSION_KEY, USER_KEY } from './storage.js';
import { Session } from './types/session.js';

export default class LocalStorage implements Storage {
  private static instance: LocalStorage;
  private storage: Record<string, any>;

  private constructor() {
    this.storage = {};
  }

  public static getInstance(): LocalStorage {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage();
    }
    return LocalStorage.instance;
  }

  public getSession(): Session {
    return this.storage[SESSION_KEY];
  }

  public setSession(session: Session | undefined): void {
    this.storage[SESSION_KEY] = session;
  }

  getUserInfo(): UserInfo {
    return this.storage[USER_KEY];
  }

  setUserInfo(userInfo: UserInfo | undefined): void {
    this.storage[USER_KEY] = userInfo;
  }
}
