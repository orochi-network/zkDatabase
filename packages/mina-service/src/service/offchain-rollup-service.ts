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

import { RollupOffChain } from '@domain';
import { Backoff, config, logger } from '@helper';
import { EProofStatusDocument } from '@zkdb/common';
import {
  DatabaseEngine,
  ModelQueueTask,
  ModelRollupOffChain,
  withCompoundTransaction,
  withTransaction,
} from '@zkdb/storage';

// The duration to wait before exiting the service after a crash to prevent a
// tight loop of restarts.
const CRASH_TIMEOUT_MS = 60000;

/** The initial delay for task retries. */
const INITIAL_DELAY = 10;

/** Defines the maximum backoff delay for task retries. This value represents
 * the upper limit for task delay and should strike a balance between system
 * responsiveness and avoiding excessive polling that could overload the
 * system. */
const DELAY_CAP_MS = 2000;

export class RollupOffChainService {
  public static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  public static async run(): Promise<void> {
    await new Backoff(INITIAL_DELAY, Infinity, DELAY_CAP_MS, logger).run(
      async () => {
        const imQueue = ModelQueueTask.getInstance();
        const imRollupOffChain = ModelRollupOffChain.getInstance();
        const task = await withTransaction(
          async (session) => imQueue.acquireNextTaskInQueue(session),
          'proofService'
        );

        if (task !== null) {
          try {
            await withCompoundTransaction(async (session) => {
              logger.debug('Task received:', task);
              const start = performance.now();

              const rollupOffChain = await RollupOffChain.create(task, session);

              // Mark queue as success
              await imQueue.markTaskProcessed(task._id, {
                session: session.proofService,
              });
              // Insert to rollup off-chain document after success
              await imRollupOffChain.insertOne(rollupOffChain, {
                session: session.proofService,
              });

              const end = performance.now();
              logger.debug(`Proof create take ${end - start}ms`);
            });
            // Backoff: false
            return false;
          } catch (error) {
            // This error from `withCompoundTransaction` that already rollback but failed
            const errorMessage =
              error instanceof Error
                ? error.message
                : // Serialize error
                  `Unknown error: ${String(error)}`;

            await imQueue.markTaskAsError(task._id, errorMessage);
            // Backoff = true;
            return true;
          } finally {
            const processedTask = await ModelQueueTask.getInstance().findOne({
              _id: task._id,
            });

            if (!processedTask) {
              throw new Error(
                `Task with ID ${task._id} is no longer present after processing`
              );
            } else if (processedTask.status === EProofStatusDocument.Proving) {
              await ModelQueueTask.getInstance().markTaskAsError(
                task._id,
                `Task status has not been updated properly, check server logs
for this task's object ID for more information`
              );
              // Backoff = true
              return true;
            }
          }
        }

        return task == null;
      },
      async (error) => {
        logger.error('Error while processing document queue:', error);
      }
    );

    logger.info('Maximum retries reached. Stopping task consumption.');
  }
}

export const SERVICE_OFFCHAIN_ROLLUP = {
  clusterName: 'offchain-rollup-service',
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

      await RollupOffChainService.run();
    } catch (error) {
      logger.error(
        'Task service crashed, waiting for 1 minute before exiting. Error:',
        error
      );
      // Sleep for CRASH_TIMEOUT before exiting to prevent the cluster from
      // immediately restarting this service, which could cause a tight loop if
      // the error is persistent.
      await RollupOffChainService.delay(CRASH_TIMEOUT_MS);
      throw error;
    }
  },
};
