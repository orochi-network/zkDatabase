import { RedisClient, TRedisCache } from '@orochi-network/framework';
import logger from './logger';
import { RedisInstance } from './redis';

export const LOCK_KEY = 'my-lock-key';
const LOCK_EXPIRATION = 300; // in seconds

export default class DistributedLock {
  private static instance: any;

  private redis: RedisClient & TRedisCache<'dbLockKey'>;

  private constructor(redis: RedisClient & TRedisCache<'dbLockKey'>) {
    this.redis = redis;
  }

  public static getInstance(): DistributedLock {
    if (!DistributedLock.instance) {
      return new DistributedLock(RedisInstance);
    }
    return DistributedLock.instance;
  }

  public async acquireLock(): Promise<boolean> {
    try {
      const result = await this.redis.dbLockKey().set('locked', {
        EX: LOCK_EXPIRATION,
        NX: true,
      });
      return result === 'OK';
    } catch (error) {
      logger.error('Error acquiring lock:', error);
      return false;
    }
  }

  public async releaseLock(): Promise<void> {
    try {
      await this.redis.dbLockKey().delete();
    } catch (error) {
      logger.error('Error releasing lock:', error);
    }
  }
}
