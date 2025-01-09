// NOTE: Since the document queue has tasks ariving in a non-deterministic and
// non-sequential order, this worker ensures polling them in the correct order
// and queue them for rollup process so that subsequent processing pipeline
// (e.g. rollup) can get the task from the queue without worrying about the
// non-deterministic arrival of tasks.
//
// The worker relies on the sequence number of the task to ensure that the
// processing is done in the correct order, i.e. the task with sequence number
// N is processed before the task with sequence number N+1.

import { config, logger } from '@helper';
import { DocumentProcessor } from '@domain';
import {
  DatabaseEngine,
  getCurrentTime,
  ModelGenericQueue,
  ModelSequencer,
  TDocumentQueuedData,
  zkDatabaseConstant,
} from '@zkdb/storage';
import Backoff from 'src/helper/backoff';
import assert from 'node:assert';
import { ESequencer } from '@zkdb/common';

/** The duration to wait before exiting the service after a crash to prevent a
 * tight loop of restarts. */
const CRASH_TIMEOUT_MS = 60000;

/** The initial delay for task retries. */
const INITIAL_DELAY = 1000;

/** Defines the maximum backoff delay for task retries. This value represents
 * the upper limit for task delay and should strike a balance between system
 * responsiveness and avoiding excessive polling that could overload the
 * system. */
const DELAY_CAP_MS = 1000;

export class DocumentWorker {
  public static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public static async run(): Promise<void> {
    const imDocumentQueue = ModelGenericQueue.getInstance<TDocumentQueuedData>(
      zkDatabaseConstant.globalCollection.documentQueue
    );

    // NOTE: The exclusion queue stores databases that currently have a
    // qualified task for potential processing but where the sequence number of
    // their next task does not match the expected value (tracking sequence
    // number + 1). This queue helps avoid repeatedly polling the same tasks
    // that fail the sequence number check, preventing unnecessary processing
    // attempts. After each iteration, one database is popped from the
    // exclusion queue, allowing it to be considered for polling in the next
    // iteration.
    const exclusionQueue: string[] = [];

    await new Backoff(INITIAL_DELAY, Infinity, DELAY_CAP_MS, logger).run(
      async () => {
        const task = await imDocumentQueue.peakNextQualifiedTask({
          databaseName: { $nin: exclusionQueue },
        });

        if (task === null) {
          exclusionQueue.shift();
          return true;
        }

        assert(task.sequenceNumber !== null, "Task's sequence number is null");

        const trackingSequenceNumber = await ModelSequencer.getInstance(
          task.databaseName
        ).current(ESequencer.LastProcessedOperation);

        if (task.sequenceNumber <= trackingSequenceNumber) {
          exclusionQueue.shift();
          throw new Error(
            `Task sequence number of task ${task._id} is less than or equal \
to the current tracking sequence number. This should never happen unless we \
has some flaws in the logic. Task sequence number: ${task.sequenceNumber}, \
tracking sequence number: ${trackingSequenceNumber}`
          );
        }

        // This means that the next sequential task has not arrived yet. We're
        // going to add this task to the exclusion queue and skip processing it
        // for now.
        if (task.sequenceNumber !== trackingSequenceNumber + 1) {
          exclusionQueue.push(task.databaseName);
          exclusionQueue.shift();
          return true;
        }

        // Acquire the task again, this time with findOneAndUpdate to prevent
        // other workers from processing the same task. Note that at this stage
        // it can still fail to acquire the task if another worker has already
        // acquired it.
        const result = await imDocumentQueue.acquireNextTaskInQueue(
          async (acquiredTask, compoundSession) => {
            await DocumentProcessor.onTask(acquiredTask, compoundSession);

            const bumpSeqResult = await ModelSequencer.getInstance(
              task.databaseName
            ).collection.findOneAndUpdate(
              {
                type: ESequencer.LastProcessedOperation,
              },
              {
                $set: {
                  seq: acquiredTask.sequenceNumber!,
                  updatedAt: getCurrentTime(),
                },
                $setOnInsert: {
                  type: ESequencer.LastProcessedOperation,
                  createdAt: getCurrentTime(),
                },
              },
              { session: compoundSession.serverless, upsert: true }
            );

            if (bumpSeqResult === null) {
              // Throw error so that the transaction rolls back everything
              throw new Error(
                `Failed to update the last processed sequence number for database ${task.databaseName}. \
Someone has updated the sequence number while we're acquiring the task for this database. \
Sequence number: ${task.sequenceNumber}, task id: ${task._id}`
              );
            }

            return true;
          },
          {
            _id: task._id,
          },
          true
        );

        // Indicates that no task was acquired, so we should back off
        if (result === null) {
          exclusionQueue.shift();
          return true;
        }

        exclusionQueue.shift();
        return false;
      },
      async (error) => {
        logger.error('Error while processing document queue:', error);
      }
    );
  }
}

export const SERVICE_DOCUMENT = {
  clusterName: 'document-worker',
  payload: async () => {
    try {
      // Connect to db
      const serverlessDb = DatabaseEngine.getInstance(config.MONGODB_URL);
      const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

      if (!serverlessDb.isConnected()) {
        await serverlessDb.connect();
      }

      if (!proofDb.isConnected()) {
        await proofDb.connect();
      }

      await DocumentWorker.run();
    } catch (error) {
      logger.error(
        'Task service crashed, waiting for 1 minute before exiting. Error:',
        error
      );
      // Sleep for CRASH_TIMEOUT before exiting to prevent the cluster from
      // immediately restarting this service, which could cause a tight loop if
      // the error is persistent.
      await DocumentWorker.delay(CRASH_TIMEOUT_MS);
      throw error;
    }
  },
};
