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

  /** Acquires the next qualified task from the queue. The task is immediately
   * marked as 'Proving', which prevents other workers from processing it. The
   * calling process must ensure complete task processing and appropriate
   * status updates (e.g., to 'Failed' or 'Proved'). A task left in 'Proving'
   * status will remain stuck in the queue indefinitely until retry mechanism
   * is implemented (e.g. a processing timeout). */
  public async acquireNextTaskInQueue(
    session?: ClientSession
  ): Promise<TQueueRecord | null> {
    // The intent is to:
    // - Not allow parallel processing of tasks from the same database
    // - Take the oldest queued task from each available database
    // TODO: Possible edge cases:
    // - A task stuck at Proving status will block all other tasks from the
    // same database. Maybe consider a timeout?
    return this.collection.findOneAndUpdate(
      {
        status: EProofStatusDocument.Queued,
        databaseName: {
          $nin: await this.collection.distinct(
            'databaseName',
            {
              status: EProofStatusDocument.Proving,
            },
            { session }
          ),
        },
      },
      {
        $set: { status: EProofStatusDocument.Proving },
      },
      {
        sort: { createdAt: 1 },
        session,
      }
    );
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

      // Index for acquiring the next task from the queue
      await collection.index(
        { status: 1, databaseName: 1, createdAt: 1 },
        { unique: false, session }
      );

      await addTimestampMongoDB(collection, session);
    }
  }
}
