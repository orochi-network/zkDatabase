import { TPagination, userName } from '@zkdb/common';
import { Request } from 'express';
import { TJWTAuthenticationPayload } from '@helper';
import Joi from 'joi';

export const ZKDATABASE_USER_NOBODY = 'nobody';
export const ZKDATABASE_USER_SYSTEM = 'system';
export const ZKDATABASE_GROUP_NOBODY = 'nobody';
export const ZKDATABASE_GROUP_SYSTEM = 'system';
export const GROUP_DEFAULT_ADMIN = 'admin';

// @todo Have better validation for JWT
// temporary solution to add { iat?: number; exp?: number }
export const APP_JWT_VALIDATION = Joi.object<TJWTAuthenticationPayload>({
  userName,
  email: Joi.string().email().required(),
  iat: Joi.number().optional(),
  exp: Joi.number().optional(),
}).unknown();

export const nobodyContext = (req: Request) => ({
  userName: ZKDATABASE_USER_NOBODY,
  email: `${ZKDATABASE_USER_NOBODY}@${ZKDATABASE_USER_NOBODY}`,
  sessionId: req.sessionID,
  req,
});

export const DEFAULT_PAGINATION: TPagination = {
  limit: 10,
  offset: 0,
};
