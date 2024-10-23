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
  constructor(
    private readonly queueName: string,
    options?: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts>
  ) {
    this.redisClient = createClient(options);
    this.redisClient.on('error', (err) =>
      console.log('Redis Client Error:', err)
    );
    this.redisClient.connect();
  }
  async enqueue(data: T): Promise<void> {
    await this.redisClient.rPush(this.queueName, JSON.stringify(data));
  }

  async dequeue(): Promise<T | null> {
    const message = await this.redisClient.blPop(this.queueName, 0);
    return message ? JSON.parse(JSON.parse(message?.element || '{}')) : null;
  }
}

export const redisQueue = new RedisQueueService('zkAppDeploymentQueue', {
  url: config.REDIS_URL,
});
