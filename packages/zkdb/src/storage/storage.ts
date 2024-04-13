export const JWT_TOKEN = "jwt_token";

export interface Storage {
  getAccessToken(): string
  setAccessToken(token: string): void
}