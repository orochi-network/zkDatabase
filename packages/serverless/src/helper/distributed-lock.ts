import RedisInstance, { RedisClient } from './redis';
import logger from './logger';

const LOCK_KEY = 'myLockKey';
const LOCK_EXPIRATION = 300; // in seconds

export default class DistributedLock {
  private redis: RedisClient;

  private constructor(redis: RedisClient) {
    this.redis = redis;
  }

  public static getInstance(): DistributedLock {
    return new DistributedLock(RedisInstance);
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
