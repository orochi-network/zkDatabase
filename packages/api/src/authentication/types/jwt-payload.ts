import * as jose from "jose";

export interface TJwtPayload extends jose.JWTPayload {
  sessionId: string;
  sessionKey: string;
  userInfo: any;
}
