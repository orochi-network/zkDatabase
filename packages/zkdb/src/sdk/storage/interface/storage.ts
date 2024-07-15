import { Session } from "../types/session.js";
import { UserInfo } from "../types/user.js";

export interface IStorage {
  getSession(): Session | null
  getUserInfo(): UserInfo | null
  setUserInfo(userInfo: UserInfo): void
  setSession(session: Session): void
  clear(): void;
}