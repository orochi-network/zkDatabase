import { EDocumentProofStatus, TQueueRecord } from '@zkdb/common';
import {
  ClientSession,
  Filter,
  FindOptions,
  InsertOneOptions,
  ObjectId,
  UpdateOptions,
  WithId,
  WithoutId,
} from 'mongodb';
import { zkDatabaseConstant } from '../../common/const.js';
import { DATABASE_ENGINE } from '../../helper/db-instance.js';
import ModelGeneral from '../base/general.js';
import ModelCollection from '../general/collection.js';

export class ModelQueueTask extends ModelGeneral<WithoutId<TQueueRecord>> {
  private static instance: ModelQueueTask | null = null;

  private constructor() {
    super(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
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
    task: WithoutId<TQueueRecord>,
    options?: InsertOneOptions
  ): Promise<void> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    await this.collection.insertOne(
      {
        ...task,
        status: EDocumentProofStatus.Queued,
      },
      options
    );
  }

  public async getLatestQueuedTaskByDatabase(
    session?: ClientSession
  ): Promise<WithId<TQueueRecord> | null> {
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

    return latestQueuedTasks[0] as WithId<TQueueRecord>;
  }

  public async getTasksByCollection(
    collectionName: string
  ): Promise<TQueueRecord[] | null> {
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

  public async getNewTask(options?: FindOptions): Promise<TQueueRecord | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const result = await this.collection.findOne(
      { status: EDocumentProofStatus.Queued },
      { sort: { createdAt: 1 }, ...options }
    );

    const task = result as TQueueRecord | null;
    return task;
  }

  public async getQueuedTask(
    filter: Filter<TQueueRecord>,
    options?: FindOptions
  ) {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    const result = await this.collection.findOne(
      { ...filter, status: EDocumentProofStatus.Queued },
      { sort: { createdAt: 1 }, ...options }
    );

    const task = result as TQueueRecord | null;
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
      { $set: { status: EDocumentProofStatus.Proving } },
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
      { $set: { status: EDocumentProofStatus.Proved } },
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
      { $set: { status: EDocumentProofStatus.Failed, error: errorMessage } },
      options
    );
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.queue
    );
    if (!(await collection.isExist())) {
      collection.index({ database: 1, operationNumber: 1 }, { unique: true });
      collection.index({ merkleRoot: 1 }, { unique: false });
      collection.index({ merkleIndex: 1 }, { unique: false });
    }
  }
}
