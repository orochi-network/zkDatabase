import { LoggerLoader } from '@orochi-network/framework';
import { logger as defaultLogger } from './logger.js';

/** Run a function repeatedly with exponential backoff. */
export class Backoff {
  /* eslint-disable-next-line no-useless-constructor --
   * Reason: This constructor is not useless */
  constructor(
    private initialDelayMs: number = 10,
    private maxRetries: number = Infinity,
    private delayCapMs: number = 1000,
    private logger: LoggerLoader = defaultLogger

    /* eslint-disable-next-line no-empty-function --
     * Reason: This constructor is empty because it does nothing beside setting
     * private members */
  ) {}

  public static async delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /** Run the provided function with exponential backoff. The function can
   * return a boolean indicating whether to backoff or not, if not the default
   * behavior is *not backing off*. Any error thrown will automatically trigger
   * a backoff. */
  public async run(
    asyncCallbackFunction: () => Promise<boolean>,
    onError: (error: any) => Promise<void>
  ): Promise<void> {
    let retries = 0;
    let delay = this.initialDelayMs;

    /* eslint-disable no-await-in-loop --
     * Retries with backoff require an await in the loop body */
    while (retries < this.maxRetries) {
      let backoff = true;

      try {
        backoff = await asyncCallbackFunction();
      } catch (error) {
        await onError(error);
      }

      if (backoff) {
        await Backoff.delay(delay);
        delay = Math.min(delay * 2, this.delayCapMs); // Exponential backoff with cap
        delay += Math.floor((Math.random() * this.delayCapMs) / 100); // Add jitter
        retries += 1;
      } else {
        delay = this.initialDelayMs;
        retries = 0;
      }
    }
    /* eslint-enable no-await-in-loop */

    this.logger.info('Maximum retries reached. Stopping task consumption.');
  }
}

export default Backoff;
