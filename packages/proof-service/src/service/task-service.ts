import logger from '../helper/logger';
import { getNextTaskId } from '../api/get-next-task';
import { createProof } from '../domain/create-proof';
class TaskService {
  private maxRetries: number;
  private initialDelay: number;

  constructor(maxRetries: number = 5, initialDelay: number = 1000) {
    this.maxRetries = maxRetries;
    this.initialDelay = initialDelay;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async fetchAndProcessTasks(): Promise<void> {
    let retries = 0;
    let delay = this.initialDelay;

    while (retries < this.maxRetries) {
      const result = await getNextTaskId();

      if (result.type === 'success') {
        const id = result.data;

        if (id) {
          logger.info('Task received with id:', id);
          
          try {
            await createProof(id)
          } catch(error) {
            logger.error(error)
          }

          retries = 0; // Reset retries on success
        } else {
          logger.info('No task available, waiting...');
          await this.delay(delay);
          delay = Math.min(delay * 2, 32000); // Exponential backoff with cap
          delay += Math.random() * 1000; // Add jitter
          retries++;
        }
      } else {
        logger.error('Error processing task:', result.message);
        await this.delay(delay);
        delay = Math.min(delay * 2, 32000); // Exponential backoff with cap
        delay += Math.random() * 1000; // Add jitter
        retries++;
      }
    }

    logger.info('Max retries reached, stopping task fetching.');
  }
}

export default TaskService;
