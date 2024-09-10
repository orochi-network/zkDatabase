/* eslint-disable no-unused-vars */
import { UserInfo } from "./types/user.js";
import { Session } from "./types/session.js";

export const SESSION_KEY = "session_data";
export const USER_KEY = "user_data"
export interface Storage {
  getSession(): Session
  setSession(session: Session): void
  getUserInfo(): UserInfo
  setUserInfo(userInfo: UserInfo): void
}