import { Filter, FindOptions, InsertOneOptions } from 'mongodb';
import ModelBasic from '../base/basic.js';
import { zkDatabaseConstants } from '../../common/const.js';

export type TaskEntity = {
  merkleIndex: bigint;
  hash: string;
  processed?: boolean;
  createdAt: Date;
  database: string;
  collection: string;
};

export class ModelQueueTask extends ModelBasic<TaskEntity> {
  private static instance: ModelQueueTask | null = null;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      zkDatabaseConstants.globalCollections.queue
    );
  }

  public static getInstance(): ModelQueueTask {
    if (!ModelQueueTask.instance) {
      ModelQueueTask.instance = new ModelQueueTask();
      ModelQueueTask.instance.collection.createIndex({ merkleIndex: 1 });
    }
    return ModelQueueTask.instance;
  }

  public async createTask(
    task: TaskEntity,
    options?: InsertOneOptions
  ): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.insertOne(
      {
        ...task,
        processed: false,
      },
      options
    );
  }

  public async getNewTask(options?: FindOptions): Promise<TaskEntity | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const result = await this.collection.findOne(
      { processed: false },
      { sort: { createdAt: 1 }, ...options }
    );

    const task = result as TaskEntity | null;
    return task;
  }

  public async getTask(filter: Filter<TaskEntity>, options?: FindOptions) {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const result = await this.collection.findOne(
      { processed: false, ...filter },
      { sort: { createdAt: 1 }, ...options }
    );

    const task = result as TaskEntity | null;
    return task;
  }

  public async markTaskProcessed(merkleIndex: bigint): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.updateOne(
      { merkleIndex },
      { $set: { processed: true } }
    );
  }
}
