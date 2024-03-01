import { GraphQLError } from 'graphql';
import * as jose from 'jose';
import logger from './logger';
import config from './config';
import ModelSession from '../model/global/session';
import { APP_JWT_VALIDATION } from '../common/types';

export interface IJWTAuthenticationPayload extends jose.JWTPayload {
  userName: string;
  email: string;
  sessionId: string;
}

export class JWTAuthentication<T extends jose.JWTPayload> {
  private secret: Uint8Array;

  constructor(secret: string) {
    this.secret = jose.base64url.decode(secret);
  }

  public async sign(payload: T): Promise<string> {
    if (config.nodeEnv === 'development') {
      // Development token won't be expired
      return new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(this.secret);
    }
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('60s')
      .sign(this.secret);
  }

  public static async verify<T extends jose.JWTPayload>(
    token: string
  ): Promise<{ payload: T } & Pick<jose.JWTVerifyResult, 'protectedHeader'>> {
    const decodedPayload = jose.decodeJwt(token) as IJWTAuthenticationPayload;
    const { error } = APP_JWT_VALIDATION.validate(decodedPayload);
    if (error) {
      logger.error(error);
      throw new GraphQLError('Token is invalid', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 },
        },
      });
    }
    const session = await ModelSession.getInstance().findOne({
      sessionId: decodedPayload.sessionId,
    });
    // Check if session is valid
    if (!session || (session && session.userName !== decodedPayload.userName)) {
      throw new GraphQLError('Username mismatch', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 },
        },
      });
    }
    // Recover the session key and verify the token
    const { payload, protectedHeader } = await jose.jwtVerify(
      token,
      jose.base64url.decode(session.sessionKey)
    );
    return { payload: payload as T, protectedHeader };
  }

  public static async verifyHeader<T extends jose.JWTPayload>(
    header: string
  ): Promise<T> {
    // Skip for development
    try {
      // 7 is length of `Bearer + space`
      const { payload } = await JWTAuthentication.verify(header.substring(7));
      return (payload as T) || undefined;
    } catch (e) {
      logger.error(e);
      throw new GraphQLError('User is not authenticated', {
        extensions: {
          code: 'UNAUTHENTICATED',
          http: { status: 401 },
        },
      });
    }
  }
}
