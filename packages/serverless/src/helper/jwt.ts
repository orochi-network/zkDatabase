import { JWTAuthentication } from '@orochi-network/framework';
import * as jose from 'jose';
import { config } from './config.js';

export type TJWTAuthenticationPayload = jose.JWTPayload & {
  userName: string;
  email: string;
  sessionId?: string;
};

export const JwtAuthorization =
  JWTAuthentication.getInstance<TJWTAuthenticationPayload>(
    config.JWT_SECRET,
    'HS256',
    config.NODE_ENV === 'development' ? '30d' : '14:d'
  );
