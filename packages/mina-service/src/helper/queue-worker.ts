import { logger } from '@helper';
import { Job, Worker, WorkerOptions } from 'bullmq';

type TProcessJob = (job: Job) => Promise<null | void>;

export class QueueWorker<T> {
  private worker: Worker;

  constructor(
    private readonly queueName: string,
    private readonly options?: WorkerOptions
  ) {}

  public start(process: TProcessJob) {
    this.worker = new Worker<T>(
      this.queueName,
      async (job) => {
        // We cover the try..catch handling
        try {
          await process(job);
        } catch (error) {
          logger.error(`Job ${job.id} failed: ${(error as Error).message}`);
          // We also need to throw error outside for bullMQ mark job as failed
          throw error;
        }
      },
      this.options
    );
    // After we init worker, register basic event
    this.eventRegister();
  }

  private eventRegister() {
    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.name} is completed`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.name} failed: ${err.message}`);
    });
  }

  public async shutdown() {
    // Graceful shutdown
    // Wait for all job is done
    await this.worker.close();
    logger.info('Worker is closed');
  }
}
