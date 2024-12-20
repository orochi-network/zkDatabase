import { config, logger } from '@helper';
import { Proof } from '@domain';
import { DatabaseEngine, withCompoundTransaction } from '@zkdb/storage';

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

      const noTaskFound = await withCompoundTransaction(async (session) => {
        const result = await Proof.getNextTask(session);
        logger.info('Task received with id:', result);
        if (result === null) {
          return true;
        }

        try {
          await Proof.create(result, session);
        } catch (error) {
          logger.error(`Error processing task with ID ${result._id}: ${error}`);
        }

        return false;
      });

      if (noTaskFound) {
        logger.info('No task available, waiting...');
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

export const TASK_SERVICE = {
  clusterName: 'task',
  payload: async () => {
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
  },
};
