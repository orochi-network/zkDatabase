import { JWTAuthentication } from '@orochi-network/framework';
import { createHash } from 'crypto';
import * as jose from 'jose';
import { config } from './config.js';

export const ACESS_TOKEN_EXPIRE_DAY =
  config.NODE_ENV === 'development' ? 30 : 14;

export const ACESS_TOKEN_EXPIRE_TIME = ACESS_TOKEN_EXPIRE_DAY * 24 * 60 * 60;

export type TJWTAuthenticationPayload = jose.JWTPayload & {
  userName: string;
  email: string;
  sessionId?: string;
};

export const JwtAuthorization =
  JWTAuthentication.getInstance<TJWTAuthenticationPayload>(
    config.JWT_SECRET,
    'HS256',
    `${ACESS_TOKEN_EXPIRE_DAY}d`
  );

export const calculateAccessTokenDigest = (accessToken: string) =>
  createHash('sha256').update(accessToken).digest('hex');

export const headerToAccessToken = (authorizationHeader: string) =>
  authorizationHeader.substring(7);
