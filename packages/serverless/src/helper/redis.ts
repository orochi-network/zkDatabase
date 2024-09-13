import { RedisClient } from '@orochi-network/framework';
import { config } from './config.js';

export const RedisInstance = RedisClient.getInstance<
  'dbLockKey' | 'ecdsaChallenge' | 'expressSession'
>('zkdb-', {
  url: config.REDIS_URL,
});

export default RedisInstance;
