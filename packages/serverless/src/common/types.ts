import { userName } from '@apollo-app';
import { TJWTAuthenticationPayload } from '@helper';
import { Request } from 'express';
import Joi from 'joi';
import { ZKDATABASE_USER_NOBODY } from './const';

export type TPublicContext = {
  req: Request;
  sessionId: string;
};

export type TAuthorizedContext = TPublicContext & {
  userName: string;
  email: string;
};

export type TApplicationContext = TPublicContext | TAuthorizedContext;

export type TFakeAuthorizedContext = TAuthorizedContext;

// @todo Have better validation for JWT
// temporary solution to add { iat?: number; exp?: number }
export const APP_JWT_VALIDATION = Joi.object<TJWTAuthenticationPayload>({
  userName,
  email: Joi.string().email().required(),
  iat: Joi.number().optional(),
  exp: Joi.number().optional(),
}).unknown();

export const nobodyContext = (req: Request): TFakeAuthorizedContext => ({
  userName: ZKDATABASE_USER_NOBODY,
  email: `${ZKDATABASE_USER_NOBODY}@${ZKDATABASE_USER_NOBODY}`,
  sessionId: req.sessionID,
  req,
});
