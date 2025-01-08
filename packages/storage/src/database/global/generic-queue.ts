import {
  ClientSession,
  Filter,
  FindOptions,
  InsertOneOptions,
  OptionalId,
} from 'mongodb';
import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';
import { TDbRecord } from '@zkdb/common';
import { TCompoundSession, withCompoundTransaction } from '../transaction';

export enum EQueueTaskStatus {
  Queued = 'Queued',
  Processing = 'Processing',
  Failed = 'Failed',
  Success = 'Success',
}

export type TGenericQueue<T> = {
  databaseName: string;
  // Sequence number is used to order tasks within the same database, if user
  // of this model doesn't need to maintain order, she can set it to null on
  // task creation.
  sequenceNumber: number | null;
  status: EQueueTaskStatus;
  data: T;
  error: any | null;
  acquiredAt: Date | null;
};

/** Un upgraded version of [ModelQueueTask] that can be used for any type of
 * queue. */
export class ModelGenericQueue<T> extends ModelGeneral<
  OptionalId<TDbRecord<TGenericQueue<T>>>
> {
  private static instance: Map<string, ModelGenericQueue<unknown>> = new Map();

  private constructor(queueName: string) {
    super(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      queueName
    );
  }

  public static getInstance<T>(queueName: string): ModelGenericQueue<T> {
    if (!this.instance.has(queueName)) {
      this.instance.set(queueName, new ModelGenericQueue(queueName));
    }
    return this.instance.get(queueName) as ModelGenericQueue<T>;
  }

  public async queueTask(
    task: Omit<TGenericQueue<T>, 'status' | 'error' | 'acquiredAt'>,
    options?: InsertOneOptions
  ): Promise<void> {
    await this.collection.insertOne(
      {
        status: EQueueTaskStatus.Queued,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        acquiredAt: null,
        ...task,
      },
      options
    );
  }

  /** Acquires and processes the next eligible task from the queue. The task is
   * immediately marked as 'Processing' to prevent concurrent processing by
   * other workers. The provided callback function executes with the acquired
   * task and a session object. Upon successful completion, the task is marked
   * as 'Success'. If the callback function throws an error, the task is marked
   * as 'Failed' and the error message is stored with the task. When
   * `removeTaskOnSuccess` is enabled, successful tasks are automatically
   * removed from the queue after processing. */
  public async acquireNextTaskInQueue<R>(
    f: (
      task: TDbRecord<TGenericQueue<T>>,
      session: TCompoundSession
    ) => Promise<R>,
    filter?: Filter<TDbRecord<TGenericQueue<T>>>,
    removeTaskOnSuccess = false
  ): Promise<R | null> {
    // The intent is to:
    // - Not allow parallel processing of tasks from the same database
    // - Take the oldest queued task from each available database
    // NOTE: The order of queries in the `$or` clause is significant. If the
    // query planner prioritizes the first query and the task queue experiences
    // a high volume of tasks, the second query may not produce results.
    // Subsequently, tasks stuck in 'Processing' status may remain unretried
    // for extended periods. To mitigate this issue, one solution is to add
    // randomization to the query order to achieve fairer task distribution.
    const task = await this.collection.findOneAndUpdate(
      {
        ...filter,
        $or: [
          {
            status: EQueueTaskStatus.Queued,
            databaseName: {
              $nin: await this.collection.distinct('databaseName', {
                status: EQueueTaskStatus.Processing,
              }),
            },
          },
          {
            // Enable retry mechanism for tasks stuck in 'Processing' status
            // for more than a timeout period
            status: EQueueTaskStatus.Processing,
            acquiredAt: {
              $lt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes
            },
          },
        ],
      },
      {
        $set: { status: EQueueTaskStatus.Processing },
      },
      {
        sort: { createdAt: 1 },
        returnDocument: 'after',
      }
    );

    if (task === null) {
      return null;
    }

    try {
      const result = withCompoundTransaction(async (session) => {
        return f(task, session);
      });

      if (removeTaskOnSuccess) {
        await this.collection.deleteOne({ _id: task._id });
      } else {
        await this.updateOne(
          {
            _id: task._id,
          },
          {
            $set: {
              status: EQueueTaskStatus.Success,
            },
          }
        );
      }

      return result;
    } catch (error) {
      let errorMessage;

      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Unknown error: ' + String(error);
      }

      await this.updateOne(
        {
          _id: task._id,
        },
        {
          $set: {
            status: EQueueTaskStatus.Failed,
            error: errorMessage,
          },
        }
      );

      throw error;
    }
  }

  /** Get the next task in the queue without acquiring it. */
  public async peakNextQualifiedTask(
    filter?: Filter<TDbRecord<TGenericQueue<T>>>,
    options?: FindOptions
  ): Promise<TDbRecord<TGenericQueue<T>> | null> {
    return this.collection.findOne(
      {
        ...filter,
        $or: [
          {
            status: EQueueTaskStatus.Queued,
            databaseName: {
              $nin: await this.collection.distinct('databaseName', {
                status: EQueueTaskStatus.Processing,
              }),
            },
          },
          {
            // Enable retry mechanism for tasks stuck in 'Processing' status
            // for more than a timeout period
            status: EQueueTaskStatus.Processing,
            acquiredAt: {
              $lt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes
            },
          },
        ],
      },
      {
        sort: { createdAt: 1 },
        ...options,
      }
    );
  }

  public static async init(queueName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance<
      TDbRecord<TGenericQueue<unknown>>
    >(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      queueName
    );
    if (!(await collection.isExist())) {
      // TODO: Add indexes
      await collection.createSystemIndex(
        { databaseName: 1, sequenceNumber: 1 },
        { unique: true, session }
      );
      // Index for acquiring the next task from the queue
      await collection.createSystemIndex(
        { status: 1, databaseName: 1, createdAt: 1, acquiredAt: 1 },
        { session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}
