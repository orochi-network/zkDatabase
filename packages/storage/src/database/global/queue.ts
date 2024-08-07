import {
  ClientSession,
  Filter,
  FindOptions,
  InsertOneOptions,
  WithId,
} from 'mongodb';
import ModelBasic from '../base/basic.js';
import { zkDatabaseConstants } from '../../common/const.js';

export type Status = 'queued' | 'executing' | 'success' | 'error';

export type TaskEntity = {
  merkleIndex: bigint;
  hash: string;
  status: Status;
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

  public async queueTask(
    task: TaskEntity,
    options?: InsertOneOptions
  ): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.insertOne(
      {
        ...task,
        status: 'queued',
      },
      options
    );
  }

  public async getLatestQueuedTaskByDatabase(
    session?: ClientSession
  ): Promise<WithId<TaskEntity> | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }

    const executingDatabases = await this.collection
      .aggregate(
        [
          {
            $match: {
              status: 'executing',
            },
          },
          {
            $group: {
              _id: '$database',
            },
          },
        ],
        { session }
      )
      .toArray();

    const executingDatabaseList = executingDatabases.map((db) => db._id);

    const latestQueuedTasks = await this.collection
      .aggregate(
        [
          {
            $match: {
              status: 'queued',
              database: { $nin: executingDatabaseList },
            },
          },
          {
            $sort: {
              database: 1,
              createdAt: -1,
            },
          },
          {
            $group: {
              _id: '$database',
              latestTask: { $first: '$$ROOT' },
            },
          },
          {
            $replaceRoot: { newRoot: '$latestTask' },
          },
        ],
        { session }
      )
      .toArray();

    return latestQueuedTasks[0] as WithId<TaskEntity>;
  }

  public async getNewTask(options?: FindOptions): Promise<TaskEntity | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const result = await this.collection.findOne(
      { status: 'queued' },
      { sort: { createdAt: 1 }, ...options }
    );

    const task = result as TaskEntity | null;
    return task;
  }

  public async getQueuedTask(
    filter: Filter<TaskEntity>,
    options?: FindOptions
  ) {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const result = await this.collection.findOne(
      { ...filter, status: 'queued' },
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
      { $set: { status: 'success' } }
    );
  }
}
