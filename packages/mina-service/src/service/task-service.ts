import { config, logger } from '@helper';
import { Proof } from '@domain';
import { DatabaseEngine, withCompoundTransaction } from '@zkdb/storage';

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

      const backoff = await withCompoundTransaction(async (session) => {
        const task = await Proof.getNextTask(session);
        if (task === null) {
          return true;
        }

        logger.debug('Task received:', task);

        try {
          await Proof.create(task, session);
          return false;
        } catch (error) {
          logger.error(`Error processing task with ID ${task._id}: ${error}`);
          return true;
        }
      });

      if (backoff) {
        logger.debug('No task available, waiting...');
        await this.delay(delay);
        delay = Math.min(delay * 2, 32000); // Exponential backoff with cap
        delay += Math.floor(Math.random() * 1000); // Add jitter
        retries++;
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
