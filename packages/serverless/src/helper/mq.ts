import {
  type RedisClientOptions,
  RedisFunctions,
  RedisModules,
  RedisScripts,
  createClient,
} from 'redis';
import config from './config';

export class RedisQueueService<T> {
  private redisClient: ReturnType<typeof createClient>;
  private uniqueList: string;
  constructor(
    private readonly queueName: string,
    options?: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts>
  ) {
    this.uniqueList = queueName + '_uniqueness';
    this.redisClient = createClient(options);
    this.redisClient.on('error', (err) =>
      console.log('Redis Client Error:', err)
    );
    this.redisClient.connect();
  }
  async enqueue(data: T): Promise<void> {
    const payload = JSON.stringify(data);
    const wasAdded = await this.redisClient.sAdd(this.uniqueList, payload);
    if (wasAdded > 0) {
      await this.redisClient.rPush(this.queueName, payload);
    }
  }

  async dequeue(): Promise<T | null> {
    const message = await this.redisClient.blPop(this.queueName, 0);
    if (message) {
      const payload = JSON.parse(JSON.parse(message?.element || '{}'));
      await this.redisClient.sRem(this.uniqueList, message.element);
      return payload as T;
    }
    return null;
  }
}

export const redisQueue = new RedisQueueService('zkAppDeploymentQueue', {
  url: config.REDIS_URL,
});
