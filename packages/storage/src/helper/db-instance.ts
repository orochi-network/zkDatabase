import { DatabaseEngine } from '../database/index.js';
import { config } from './config.js';

export const DB = {
  proof: DatabaseEngine.getInstance(config.PROOF_MONGODB_URL),
  service: DatabaseEngine.getInstance(config.MONGODB_URL),
};
