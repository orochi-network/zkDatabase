import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { EQueueTaskStatus, TDbRecord, TGenericQueue } from '@zkdb/common';
import {
  ClientSession,
  Filter,
  FindOptions,
  InsertOneOptions,
  OptionalId,
} from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';
import { TCompoundSession, withCompoundTransaction } from '../transaction';

const TASK_TIMEOUT_MS = 1000 * 60 * 10; // 10 minutes

/** Un upgraded version of [ModelQueueTask] that can be used for any type of
 * queue. */
export class ModelGenericQueue<T> extends ModelGeneral<
  OptionalId<TDbRecord<TGenericQueue<T>>>
> {
  // eslint-disable-next-line no-use-before-define
  private static instance: Map<string, ModelGenericQueue<unknown>> = new Map();

  private constructor(queueName: string) {
    super(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      queueName
    );
  }

  /** Session is required to avoid concurrency issues such as write conflict
   * while initializing the collection (create index, etc.) and writing to the
   * collection at the same time. */
  public static async getInstance<T>(
    queueName: string,
    session: ClientSession
  ): Promise<ModelGenericQueue<T>> {
    if (!this.instance.has(queueName)) {
      this.instance.set(queueName, new ModelGenericQueue(queueName));
      await ModelGenericQueue.init(queueName, session);
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
   * removed from the queue after processing.
   *
   * @return The result of the callback function or `null` if no task is available to acquire.
   * */
  public async acquireNextTaskInQueue<R>(
    callback: (
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
              // FIXME: data races can still happen because of the below nested
              // query. For example if two workers run this query at the same
              // time before the outter query is executed, they can both get
              // the same list of databaseName and acquire the two tasks of one
              // database in parallel. This is prevented in the merkle tree
              // worker implementation by checking if the sequence number is
              // the expected one. For the off chain rollup worker, the
              // sequence number is also compared with the rollup step in order
              // to prevent non-sequential processing. However, it'd be better
              // to have a more correct behavior here. A fix could be to
              // abstract the whole queue operation (i.e. pop from queue) to
              // include the sequence number check.
              $nin: await this.collection.distinct('databaseName', {
                $or: [
                  {
                    status: EQueueTaskStatus.Processing,
                  },
                  {
                    // We should not continue processing tasks for databases
                    // that have failed tasks in the queue. The latest failed
                    // task should be resolved manually before we can continue.
                    status: EQueueTaskStatus.Failed,
                  },
                ],
              }),
            },
          },
          {
            // Enable retry mechanism for tasks stuck in 'Processing' status
            // for more than a timeout period.
            // NOTE: that this is based on the assumption that if the task is
            // stuck in 'Processing' status for more than a timeout period, it
            // is likely that the task is cancelled midway and the transaction
            // is rolled back. Thus the caller of this function should ensure
            // that every task's operations are contained within a transaction.
            status: EQueueTaskStatus.Processing,
            acquiredAt: {
              $lt: new Date(Date.now() - TASK_TIMEOUT_MS),
            },
          },
        ],
      },
      {
        $set: { status: EQueueTaskStatus.Processing, acquiredAt: new Date() },
      },
      {
        sort: { sequenceNumber: 1 },
        returnDocument: 'after',
      }
    );

    if (task === null) {
      return null;
    }

    try {
      const result = await withCompoundTransaction(async (session) => {
        return callback(task, session);
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
        errorMessage = `Unknown error: ${String(error)}`;
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
                $or: [
                  {
                    status: EQueueTaskStatus.Processing,
                  },
                  {
                    // We must not continue processing tasks for databases that
                    // have failed tasks in the queue. The latest failed task
                    // should be resolved before we can continue.
                    status: EQueueTaskStatus.Failed,
                  },
                ],
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
        sort: { sequenceNumber: 1 },
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
