// NOTE: We have implemented a robust task acquisition mechanism that enables
// concurrent processing of multiple tasks through multiple workers. The
// mechanism's built-in constraint ensures only one database is processed at a
// time, enabling safe concurrent processing of tasks from different database
// queues. As task processing utilizes a CPU-bound Rust backend rather than an
// I/O-bound one, effective parallelization requires spawning multiple workers
// instead of running multiple promises concurrently, since the latter would
// not improve processing performance. Furthermore, since the Rust backend
// already employs multiple threads for parallelization, the primary benefit of
// spawning multiple workers is achieving fair task distribution across
// database queues, rather than improving overall processing speed.

import { config, logger } from '@helper';
import { Proof } from '@domain';
import {
  DatabaseEngine,
  ModelQueueTask,
  withCompoundTransaction,
  withTransaction,
} from '@zkdb/storage';
import { EProofStatusDocument } from '@zkdb/common';
import { Mina, NetworkId } from 'o1js';

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
      const x = Mina.setActiveInstance({});

      let backoff = true;

      const imQueue = ModelQueueTask.getInstance();

      const task = await withTransaction(
        async (session) => imQueue.acquireNextTaskInQueue(session),
        'proofService'
      );

      if (task !== null) {
        try {
          await withCompoundTransaction(async (session) => {
            logger.debug('Task received:', task);
            const start = performance.now();

            await Proof.create(task, session);

            await imQueue.markTaskProcessed(task._id, {
              session: session.proofService,
            });

            const end = performance.now();
            logger.debug(`Proof create take ${end - start}`);
          });

          backoff = false;
        } catch (error) {
          logger.error(`Error processing task with ID ${task._id}:`, error);
          let errorMessage;

          if (error instanceof Error) {
            errorMessage = error.message;
          } else {
            errorMessage = 'Unknown error: ' + String(error);
          }

          await imQueue.markTaskAsError(task._id, errorMessage);

          backoff = true;
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
              `Task status has not been updated properly, check server logs
for this task's object ID for more information`
            );
          }
        }
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
