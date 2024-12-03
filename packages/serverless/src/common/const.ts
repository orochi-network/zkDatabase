import { Permission } from '@zkdb/permission';
import { Request } from 'express';
import { TJWTAuthenticationPayload } from 'helper/jwt';
import Joi from 'joi';
import { userName } from '../apollo/app/common.js';

// System user
export const ZKDATABASE_USER_NOBODY = 'nobody';
export const ZKDATABASE_USER_SYSTEM = 'system';
export const ZKDATABASE_GROUP_NOBODY = 'nobody';
export const ZKDATABASE_GROUP_SYSTEM = 'system';

export const DEFAULT_GROUP_ADMIN = 'admin';

export const O1JS_VALID_TYPE = [
  'CircuitString',
  'UInt32',
  'UInt64',
  'Bool',
  'Sign',
  'Character',
  'Int64',
  'Field',
  'PrivateKey',
  'PublicKey',
  'Signature',
  'MerkleMapWitness',
];

export const PERMISSION_DEFAULT_VALUE = Permission.policyStrict().value;

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
