import { RedisClient } from '@orochi-network/framework';
import { config } from './config.js';

export const RedisInstance = RedisClient.getInstance<
  'dbLockKey' | 'expressSession' | 'accessTokenDigest'
>('zkdb-', {
  url: config.REDIS_URL,
});

export default RedisInstance;
