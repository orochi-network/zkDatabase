import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE, logger } from '@helper';
import {
  EQueueTaskStatus,
  TDbRecord,
  TDocumentQueuedData,
  TGenericQueue,
  TRollupQueueData,
} from '@zkdb/common';
import {
  ClientSession,
  Filter,
  FindOptions,
  InsertOneOptions,
  MongoServerError,
  OptionalId,
} from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';
import {
  TCompoundSession,
  withCompoundTransaction,
  withTransaction,
} from '../transaction';

const TASK_TIMEOUT_MS = 1000 * 60 * 10; // 10 minutes

export enum EQueueType {
  DocumentQueue,
  RollupOffChainQueue,
}

type TMapQueueTypeToData = {
  [EQueueType.DocumentQueue]: TDocumentQueuedData;
  [EQueueType.RollupOffChainQueue]: TRollupQueueData;
};

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
  public static async getInstance<Q extends EQueueType>(
    queueType: Q,
    session: ClientSession
  ): Promise<ModelGenericQueue<TMapQueueTypeToData[Q]>> {
    const queueName =
      queueType === EQueueType.DocumentQueue
        ? zkDatabaseConstant.globalCollection.documentQueue
        : zkDatabaseConstant.globalCollection.rollupOffChainQueue;

    if (!this.instance.has(queueName)) {
      this.instance.set(queueName, new ModelGenericQueue(queueName));
      await ModelGenericQueue.init(queueType, queueName, session);
    }

    return this.instance.get(queueName) as ModelGenericQueue<
      TMapQueueTypeToData[Q]
    >;
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
    let task: TDbRecord<TGenericQueue<T>> | null = null;

    try {
      task = await withTransaction(
        async (session) =>
          this.collection.findOneAndUpdate(
            await this.getQueryCriteria(session, filter),
            {
              $set: {
                status: EQueueTaskStatus.Processing,
                acquiredAt: new Date(),
              },
            },
            {
              sort: { sequenceNumber: 1 },
              returnDocument: 'after',
              session,
            }
          ),
        'proofService'
      );
    } catch (e) {
      // This means the task is already acquired by another worker.
      // DuplicateKey error
      // https://www.mongodb.com/docs/manual/reference/error-codes/#mongodb-error-11000
      if (e instanceof MongoServerError && String(e.code) == '11000') {
        logger.warning(
          `Task aquisition conflict due to duplicate key error is ignore, this is expected \
and has been handled properly. However if this warning appears frequently, it may indicate \
that the acquisition logic is suboptimal.`
        );
        return null;
      }

      throw e;
    }

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
  public async peekNextQualifiedTask(
    filter?: Filter<TDbRecord<TGenericQueue<T>>>,
    options?: FindOptions
  ): Promise<TDbRecord<TGenericQueue<T>> | null> {
    return withTransaction(async (session) =>
      this.collection.findOne(await this.getQueryCriteria(session, filter), {
        sort: { sequenceNumber: 1 },
        ...options,
      })
    );
  }

  /** Get the filter criteria for the next task in the queue. Accepts an
   * optional filter object to further refine the criteria. */
  private async getQueryCriteria<T>(
    session: ClientSession,
    filter?: Filter<TDbRecord<TGenericQueue<T>>>
  ) {
    return {
      ...filter,
      $or: [
        {
          status: EQueueTaskStatus.Queued,
          databaseName: {
            $nin: await this.collection.distinct(
              'databaseName',
              {
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
              },
              { session }
            ),
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
    };
  }

  public static async init(
    queueType: EQueueType,
    queueName: string,
    session?: ClientSession
  ) {
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
      // This partial unique constraint makes sure that only one task is
      // processed at a time for each database.
      await collection.createSystemIndex(
        { databaseName: 1, status: 1 },
        {
          unique: true,
          partialFilterExpression: {
            status: EQueueTaskStatus.Processing,
          },
          session,
        }
      );

      switch (queueType) {
        case EQueueType.DocumentQueue:
          await collection.createSystemIndex({
            databaseName: 1,
            'data.docId': 1,
          });
          break;
        case EQueueType.RollupOffChainQueue:
          break;
      }

      await collection.addTimestampMongoDb({ session });
    }
  }
}
