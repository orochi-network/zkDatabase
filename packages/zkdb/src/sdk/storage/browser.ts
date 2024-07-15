import { IStorage } from './interface/storage.js';
import { Session } from './types/session.js';
import { UserInfo } from './types/user.js';

const SESSION_ID_KEY = 'session_id';
const SESSION_KEY = 'session_key';

const USER_EMAIL = 'user_email';
const USER_NAME = 'user_name';

export class BrowserStorage implements IStorage {
  getSession(): Session | null {
    const sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId || sessionId.length === 0) {
      return null;
    }

    const sessionKey = localStorage.getItem(SESSION_KEY);
    if (!sessionKey || sessionKey.length === 0) {
      return null;
    }

    return {
      sessionId,
      sessionKey,
    };
  }

  setSession(session: Session) {
    localStorage.setItem(SESSION_KEY, session.sessionKey);
    localStorage.setItem(SESSION_ID_KEY, session.sessionId);
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

    return {
      userName: userName,
      email: userEmail,
    };
  }

  setUserInfo(userInfo: UserInfo) {
    localStorage.setItem(USER_EMAIL, userInfo.email);
    localStorage.setItem(USER_NAME, userInfo.userName);
  }

  clear(): void {
    localStorage.clear();
  }
}
