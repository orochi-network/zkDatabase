import { Joi } from '@orochi-network/framework';

import { ZKDATABASE_USER_NOBODY } from './const';
import { userName } from '../apollo/app/common';

export interface AppContext {
  userName: string;
  email: string;
  sessionId: string;
}

export const APP_JWT_VALIDATION = Joi.object<
  AppContext & { iat?: number; exp?: number }
>({
  userName,
  email: Joi.string().email().required(),
  sessionId: Joi.string()
    .pattern(/[_A-Z,a-z,0-9,-]+/)
    .required(),
  iat: Joi.number().optional(),
  exp: Joi.number().optional(),
});

export const APP_CONTEXT_NOBODY: AppContext = {
  userName: ZKDATABASE_USER_NOBODY,
  email: `${ZKDATABASE_USER_NOBODY}@${ZKDATABASE_USER_NOBODY}`,
  sessionId: '',
};
