import { DatabaseEngine } from '@database';
import { config } from './config';

export const DATABASE_ENGINE = {
  dbMina: DatabaseEngine.getInstance(config.PROOF_MONGODB_URL),
  dbServerless: DatabaseEngine.getInstance(config.MONGODB_URL),
};

export type TDatabaseEngineStaticInstance = typeof DATABASE_ENGINE;
