import { UserInfo } from "../types/user.js";

export interface IStorage {
  getAccessToken(): string | null
  getUserInfo(): UserInfo | null
  setUserInfo(userInfo: UserInfo): void
  setAccessToken(accessToken: string): void
  clear(): void;
}