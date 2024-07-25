import { RedisClient } from '@orochi-network/framework';
import logger from './logger.js';
import { RedisInstance } from './redis.js';

const LOCK_KEY = 'my_lock_key';
const LOCK_EXPIRATION = 300; // in seconds

export default class DistributedLock {
  private static instance: any;

  private redis: RedisClient;

  private constructor(redis: RedisClient) {
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
      const result = await this.redis.set(LOCK_KEY, 'locked', {
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
      await this.redis.delete(LOCK_KEY);
    } catch (error) {
      logger.error('Error releasing lock:', error);
    }
  }
}
