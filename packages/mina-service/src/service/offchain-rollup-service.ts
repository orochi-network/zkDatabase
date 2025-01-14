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
import { TRollupQueueData } from '@zkdb/common';
import {
  DatabaseEngine,
  ModelGenericQueue,
  ModelRollupOffChain,
  withTransaction,
  zkDatabaseConstant,
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
        const imRollUpQueue = await withTransaction(
          (session) =>
            ModelGenericQueue.getInstance<TRollupQueueData>(
              zkDatabaseConstant.globalCollection.rollupOffChainQueue,
              session
            ),
          'proofService'
        );

        const rollupResult = await imRollUpQueue.acquireNextTaskInQueue(
          async (acquiredTask, compoundSession) => {
            const start = performance.now();

            const rollupOffChain = await RollupOffChain.create(
              acquiredTask.data,
              compoundSession
            );

            const end = performance.now();
            logger.debug(`Proof create take ${end - start}ms`);

            return rollupOffChain;
          }
        );

        if (rollupResult !== null) {
          const imRollUpOffChain = ModelRollupOffChain.getInstance();
          // Insert to rollup off-chain document after success
          await imRollUpOffChain.insertOne(rollupResult);

          // Backoff: false
          return false;
        }
        // Backoff: true
        return rollupResult == null;
      },
      async (error) => {
        logger.error('Error while processing document queue:', error);
      }
    );
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
        'RollupOffChainService crashed, waiting for 1 minute before exiting. Error:',
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
