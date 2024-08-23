import * as jose from "jose";
import { getJwtPayload } from "../bridge/token-data.js";
import { JwtPayload } from "./types/jwt-payload.js";

async function generateJwtToken(payload: JwtPayload): Promise<string | null> {
  const decodedSessionKey = jose.base64url.decode(payload.sessionKey);

  return new jose.SignJWT({
    ...payload.userInfo,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(decodedSessionKey);
}

export async function getToken(): Promise<string | null> {
  const jwtPayload = getJwtPayload();

  if (jwtPayload) {
    return generateJwtToken(jwtPayload);
  } else {
    return null;
  }
}
