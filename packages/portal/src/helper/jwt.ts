import { GraphQLError } from 'graphql';
import * as jose from 'jose';
import logger from './logger';
import config from './config';
import { Singleton } from '@orochi-network/framework';

export interface IJWTAuthenticationPayload extends jose.JWTPayload {
  uuid: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  zkDatabase?: boolean;
}

export const jwtExpired = 7200;

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
        .sign(this.secret);
    }
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('2h')
      .sign(this.secret);
  }

  public async verify(
    token: string
  ): Promise<{ payload: T } & Pick<jose.JWTVerifyResult, 'protectedHeader'>> {
    const { payload, protectedHeader } = await jose.jwtVerify(
      token,
      this.secret
    );
    return { payload: payload as T, protectedHeader };
  }

  public async verifyHeader(header: string): Promise<T> {
    // Skip for development
    try {
      // 7 is length of `Bearer + space`
      const { payload } = await this.verify(header.substring(7));
      return payload || undefined;
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

export const JWTAuthenInstance = Singleton(
  'jwt-authentication',
  JWTAuthentication<IJWTAuthenticationPayload>,
  config.hmacSecretKey
);

export default JWTAuthenInstance;
