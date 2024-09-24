import { IStorage } from './interface/storage.js';
import { UserInfo } from './types/user.js';

const ACCESS_TOKEN_KEY = 'access_token';

const USER_EMAIL = 'user_email';
const USER_NAME = 'user_name';
const USER_ADDRESS = 'user_address';

export class BrowserStorage implements IStorage {
  
  getAccessToken(): string | null {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    return accessToken;
  }

  setAccessToken(accessToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  getUserInfo(): UserInfo | null {
    const userEmail = localStorage.getItem(USER_EMAIL);
    if (!userEmail || userEmail.length === 0) {
      return null;
    }

    const userName = localStorage.getItem(USER_NAME);
    if (!userName || userName.length === 0) {
      return null;
    }

    const userAddress = localStorage.getItem(USER_ADDRESS);
    if (!userAddress || userAddress.length === 0) {
      return null;
    }

    return {
      userName: userName,
      email: userEmail,
      publicKey: userAddress,
    };
  }

  setUserInfo(userInfo: UserInfo) {
    localStorage.setItem(USER_EMAIL, userInfo.email);
    localStorage.setItem(USER_NAME, userInfo.userName);
    localStorage.setItem(USER_NAME, userInfo.publicKey);
  }

  clear(): void {
    localStorage.clear();
  }
}
