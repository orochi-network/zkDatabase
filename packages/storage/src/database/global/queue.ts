import { EDocumentProofStatus, TQueueRecord } from '@zkdb/common';
import {
  ClientSession,
  Filter,
  FindOptions,
  InsertOneOptions,
  ObjectId,
  UpdateOptions,
  UpdateResult,
  WithoutId,
} from 'mongodb';
import { zkDatabaseConstant } from '../../common/const.js';
import { addTimestampMongoDB } from '../../helper/common.js';
import { DB } from '../../helper/db-instance.js';
import ModelGeneral from '../base/general.js';
import ModelCollection from '../general/collection.js';

export class ModelQueueTask extends ModelGeneral<WithoutId<TQueueRecord>> {
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
  ): Promise<TQueueRecord | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }

    const executingDatabases = await this.collection
      .aggregate(
        [
          {
            $match: {
              status: EDocumentProofStatus.Proving,
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
              status: EDocumentProofStatus.Queued,
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

    return latestQueuedTasks[0] as TQueueRecord;
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
    return this.collection.findOne(
      { status: EDocumentProofStatus.Queued },
      { sort: { createdAt: 1 }, ...options }
    );
  }

  public async getQueuedTask(
    filter: Filter<TQueueRecord>,
    options?: FindOptions
  ): Promise<TQueueRecord | null> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    return this.collection.findOne(
      { ...filter, status: EDocumentProofStatus.Queued },
      { sort: { createdAt: 1 }, ...options }
    );
  }

  public async markTaskAsExecuting(
    taskId: ObjectId,
    options?: UpdateOptions
  ): Promise<UpdateResult> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    return this.collection.updateOne(
      { _id: taskId },
      { $set: { status: EDocumentProofStatus.Proving } },
      options
    );
  }

  public async markTaskProcessed(
    taskId: ObjectId,
    options?: UpdateOptions
  ): Promise<UpdateResult> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    return this.collection.updateOne(
      { _id: taskId },
      { $set: { status: EDocumentProofStatus.Proved } },
      options
    );
  }

  public async markTaskAsError(
    taskId: ObjectId,
    errorMessage: string,
    options?: UpdateOptions
  ): Promise<UpdateResult> {
    if (!this.collection) {
      throw new Error('TaskQueue is not connected to the database.');
    }
    return this.collection.updateOne(
      { _id: taskId },
      { $set: { status: EDocumentProofStatus.Failed, error: errorMessage } },
      options
    );
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TQueueRecord>(
      zkDatabaseConstant.globalProofDatabase,
      DB.proof,
      zkDatabaseConstant.globalCollection.queue
    );
    /*
      operationNumber: number;
      merkleIndex: bigint;
      hash: string;
      status: EDocumentProofStatus;
      database: string;
      collection: string;
      docId: string;
      merkleRoot: string;
      error?: string;
    */
    if (!(await collection.isExist())) {
      collection.index(
        { database: 1, operationNumber: 1 },
        { unique: true, session }
      );
      collection.index({ merkleRoot: 1 }, { unique: false, session });
      collection.index({ merkleIndex: 1 }, { unique: false, session });
      collection.index({ hash: 1 }, { unique: true, session });

      addTimestampMongoDB(collection, session);
    }
  }
}
