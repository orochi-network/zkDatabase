import { DatabaseEngine } from '../database/index.js';
import { config } from './config.js';

export const DATABASE_ENGINE = {
  proofService: DatabaseEngine.getInstance(config.PROOF_MONGODB_URL),
  serverless: DatabaseEngine.getInstance(config.MONGODB_URL),
};

export type TDatabaseEngineStaticInstance = typeof DATABASE_ENGINE;
