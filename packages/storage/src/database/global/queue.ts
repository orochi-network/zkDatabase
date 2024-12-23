import { EProofStatusDocument, TQueueRecord } from '@zkdb/common';
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
import { zkDatabaseConstant } from '@common';
import { addTimestampMongoDB, DATABASE_ENGINE } from '@helper';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

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
        status: EProofStatusDocument.Queued,
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
              status: EProofStatusDocument.Proving,
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
              status: EProofStatusDocument.Queued,
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

    return latestQueuedTasks.length >= 1
      ? (latestQueuedTasks[0] as TQueueRecord)
      : null;
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
      { status: EProofStatusDocument.Queued },
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
      { ...filter, status: EProofStatusDocument.Queued },
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
      { $set: { status: EProofStatusDocument.Proving } },
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
      { $set: { status: EProofStatusDocument.Proved } },
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
      { $set: { status: EProofStatusDocument.Failed, error: errorMessage } },
      options
    );
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TQueueRecord>(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.queue
    );
    /*
      operationNumber: number;
      merkleIndex: bigint;
      hash: string;
      status: EProofStatusDocument;
      database: string;
      collection: string;
      docId: string;
      merkleRoot: string;
      error?: string;
    */
    if (!(await collection.isExist())) {
      await collection.index(
        { databaseName: 1, operationNumber: 1 },
        { unique: true, session }
      );
      await collection.index({ merkleRoot: 1 }, { unique: false, session });
      await collection.index({ merkleIndex: 1 }, { unique: false, session });
      await collection.index({ hash: 1 }, { unique: true, session });

      await addTimestampMongoDB(collection, session);
    }
  }
}
