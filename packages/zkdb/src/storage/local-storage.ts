import { Storage, JWT_TOKEN } from './storage.js';

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

  public getAccessToken(): string {
    return this.storage[JWT_TOKEN];
  }

  public setAccessToken(token: string): void {
    this.storage[JWT_TOKEN] = token;
  }
}
