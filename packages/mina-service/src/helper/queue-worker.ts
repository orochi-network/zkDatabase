import { logger } from '@helper';
import { Job, Worker, WorkerOptions } from 'bullmq';
import { TTransactionQueue } from '@zkdb/common';

type TProcessJob = (job: Job) => Promise<void>;
/**
 * QueueWorker take responsibility for handle message queue from bullMQ
 * We can enhanced it by implement multiple worker for compile service
 * It's cover the bullMQ's `Worker` including init, start, event register and graceful shutdown
 */
export class QueueWorker {
  private worker: Worker;

  constructor(
    private readonly queueName: string,
    private readonly options?: WorkerOptions
  ) {}

  public start(process: TProcessJob) {
    this.worker = new Worker<TTransactionQueue>(
      this.queueName,
      async (job) => {
        // We cover the try..catch handling
        try {
          await process(job);
        } catch (error) {
          logger.error(
            `Transaction ${job.data.transactionObjectId} failed: ${(error as Error).message}`
          );
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
    this.worker.on('completed', (job: Job<TTransactionQueue>) => {
      logger.info(`Transaction ${job.data.transactionObjectId} is completed`);
    });

    this.worker.on('failed', (job: Job<TTransactionQueue> | undefined, err) => {
      logger.error(
        `Job ${job?.data.transactionObjectId} failed: ${err.message}`
      );
    });
  }

  public async shutdown() {
    // Graceful shutdown
    // Wait for all job is done
    await this.worker.close();
    logger.info('Worker is closed');
  }
}
