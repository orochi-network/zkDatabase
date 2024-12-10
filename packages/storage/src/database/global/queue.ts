import {
  ClientSession,
  Db,
  Filter,
  FindOptions,
  InsertOneOptions,
  ObjectId,
  UpdateOptions,
  WithId,
} from 'mongodb';
import { zkDatabaseConstant } from '../../common/const.js';
import { DB } from '../../helper/db-instance.js';
import ModelGeneral from '../base/general.js';
import ModelCollection from '../general/collection.js';

export type Status = 'queued' | 'proving' | 'proved' | 'failed';

export type TaskEntity = {
  operationNumber: number;
  merkleIndex: bigint;
  hash: string;
  status: Status;
  createdAt: Date;
  database: string;
  collection: string;
  docId: string;
  merkleRoot: string;
  error?: string;
};

export class ModelQueueTask extends ModelGeneral<TaskEntity> {
  private static instance: ModelQueueTask | null = null;

  private constructor() {
    super(
      zkDatabaseConstant.globalProofDatabase,
      DB.proof,
      zkDatabaseConstant.globalCollection.queue
    );
  }

  public static getInstance(): ModelQueueTask {
    if (!ModelQueueTask.instance) {
      ModelQueueTask.instance = new ModelQueueTask();
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
              status: 'proving',
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
              createdAt: 1,
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

  public async getTasksByCollection(
    collectionName: string
  ): Promise<TaskEntity[] | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }

    try {
      const result = await this.collection
        .find({ collection: collectionName })
        .toArray();
      return result;
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      return null;
    }
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

  public async markTaskAsExecuting(
    taskId: ObjectId,
    options?: UpdateOptions
  ): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.updateOne(
      { _id: taskId },
      { $set: { status: 'proving' } },
      options
    );
  }

  public async markTaskProcessed(
    taskId: ObjectId,
    options?: UpdateOptions
  ): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.updateOne(
      { _id: taskId },
      { $set: { status: 'proved' } },
      options
    );
  }

  public async markTaskAsError(
    taskId: ObjectId,
    errorMessage: string,
    options?: UpdateOptions
  ): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.updateOne(
      { _id: taskId },
      { $set: { status: 'failed', error: errorMessage } },
      options
    );
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalProofDatabase,
      DB.proof,
      zkDatabaseConstant.globalCollection.queue
    );
    if (!(await collection.isExist())) {
      collection.index({ database: 1, operationNumber: 1 }, { unique: true });
      collection.index({ merkleRoot: 1 }, { unique: false });
      collection.index({ merkleIndex: 1 }, { unique: false });
    }
  }
}
