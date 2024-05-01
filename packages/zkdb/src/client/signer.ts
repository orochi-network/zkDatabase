import * as jose from 'jose';
import { Session } from '../storage/types/session.js';

export async function signRequest(
  session: Session,
  payload: any
): Promise<string | null> {
  const decodedSessionKey = jose.base64url.decode(session.sessionKey);

  return new jose.SignJWT({
    ...payload,
    sessionId: session.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('60s')
    .sign(decodedSessionKey);
}

