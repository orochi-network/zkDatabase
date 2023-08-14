import { Singleton } from '@orochi-network/framework';
import { SetOptions, createClient } from 'redis';
import config from './config';
import logger from './logger';

export class RedisClient {
  private _client;

  constructor(url: string) {
    this._client = createClient({
      url,
    });
    this._client.on('error', (err) => logger.error('Redis client error', err));
  }

  public async connect() {
    try {
      await this._client.connect();
      logger.info('Redis client connected to', config.redisUrl);
    } catch (error) {
      logger.error('Failed to connect to redis', error);
    }
  }

  public async get(key: string): Promise<string | null> {
    return this._client.get(key);
  }

  public async set(
    key: string,
    value: string,
    options?: SetOptions
  ): Promise<string | null> {
    return this._client.set(key, value, options);
  }

  public async setEx(
    key: string,
    seconds: number,
    value: string
  ): Promise<string> {
    return this._client.setEx(key, seconds, value);
  }

  public async delete(key: string): Promise<number> {
    return this._client.del(key);
  }

  public async listPush(key: string, value: string) {
    return this._client.lPush(key, value);
  }

  public async expireAt(key: string, timestamp: number) {
    return this._client.expireAt(key, timestamp);
  }

  public async listGetAll(key: string): Promise<string[]> {
    return this._client.lRange(key, 0, -1);
  }

  public listRemoveItem(key: string, value: string): Promise<number> {
    return this._client.lRem(key, 0, value);
  }
}

export const RedisInstance = Singleton<RedisClient>(
  'redis-client',
  RedisClient,
  config.redisUrl
);

export default RedisInstance;
