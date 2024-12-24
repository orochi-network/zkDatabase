// TODO: We have implemented a robust task acquisition mechanism that allows
// concurrent processing of multiple tasks through multiple workers. The
// mechanism's built-in constraint ensures only one database is processed at a
// time, making it safe to process multiple tasks from different database
// queues simultaneously. However, the optimal approach depends on whether the
// task (prover) is CPU-bound or I/O-bound. If I/O-bound, we can utilize
// Node.js's default event loop for concurrent processing. If CPU-bound, we'll
// need to implement multiple process workers to achieve true parallelism.

import { config, logger } from '@helper';
import { Proof } from '@domain';
import {
  DatabaseEngine,
  ModelQueueTask,
  withCompoundTransaction,
} from '@zkdb/storage';
import { EProofStatusDocument } from '@zkdb/common';

// The duration to wait before exiting the service after a crash to prevent a
// tight loop of restarts.
const CRASH_TIMEOUT = 60000;

export class TaskService {
  private maxRetries: number;
  private initialDelay: number;

  constructor(initialDelay: number = 1000, maxRetries: number = Infinity) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public async run(): Promise<void> {
    let retries = 0;
    let delay = this.initialDelay;

    while (true) {
      if (retries >= this.maxRetries) {
        break;
      }

      let backoff = true;

      const task = await withCompoundTransaction(async (session) =>
        ModelQueueTask.getInstance().acquireNextTaskInQueue(
          session.proofService
        )
      );

      if (task !== null) {
        backoff = await withCompoundTransaction(async (session) => {
          logger.debug('Task received:', task);

          try {
            await Proof.create(task, session);
            return false;
          } catch (error) {
            logger.error(`Error processing task with ID ${task._id}: ${error}`);
            return true;
          } finally {
            const processedTask = await ModelQueueTask.getInstance().findOne({
              _id: task._id,
            });

            if (processedTask === null) {
              logger.error(
                `Task with ID ${task._id} is no longer present after processing`
              );
            } else if (processedTask.status === EProofStatusDocument.Proving) {
              await ModelQueueTask.getInstance().markTaskAsError(
                task._id,
                `Unexpected error while processing task, check server logs
for this task's object ID for more information`,
                { session: session.proofService }
              );
            }
          }
        });
      }

      if (backoff) {
        await this.delay(delay);
        delay = Math.min(delay * 2, 32000); // Exponential backoff with cap
        delay += Math.floor(Math.random() * 1000); // Add jitter
        retries++;

        logger.debug(`Task service backing off for ${delay}ms`);
      } else {
        delay = this.initialDelay;
        retries = 0;
      }
    }

    logger.info('Maximum retries reached. Stopping task consumption.');
  }
}

export const SERVICE_TASK = {
  clusterName: 'task',
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

      const taskService = new TaskService();

      await taskService.run();
    } catch (error) {
      logger.error(
        'Task service crashed, waiting for 1 minute before exiting. Error:',
        error
      );
      // Sleep for CRASH_TIMEOUT before exiting to prevent the cluster from
      // immediately restarting this service, which could cause a tight loop if
      // the error is persistent.
      await new Promise((resolve) => setTimeout(resolve, CRASH_TIMEOUT));
      throw error;
    }
  },
};
