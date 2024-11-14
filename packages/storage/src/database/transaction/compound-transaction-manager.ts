import { ClientSession, MongoError } from 'mongodb';
import { DB } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';

export type CompoundSession = {
  sessionService: ClientSession;
  sessionProof: ClientSession;
};

export async function withCompoundTransaction<T>(
  callback: (session: CompoundSession) => Promise<T>
): Promise<T | null> {
  const sessionService = DB['service'].client.startSession();
  const sessionProof = DB['proof'].client.startSession();
  let result: T | null = null;

  try {
    sessionService.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    });
    sessionProof.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    });

    result = await callback({ sessionService, sessionProof });

    await sessionService.commitTransaction();
    await sessionProof.commitTransaction();
  } catch (error) {
    logger.error('DatabaseEngine::withCompoundTransaction()', {
      message: (error as MongoError).message,
      code: (error as MongoError).code,
      stack: (error as Error).stack,
    });
    if (sessionService.inTransaction()) {
      try {
        await sessionService.abortTransaction();
      } catch (abortError) {
        logger.error(
          'DatabaseEngine::withCompoundTransaction() - Abort failed for service',
          {
            message: (abortError as MongoError).message,
            code: (abortError as MongoError).code,
            stack: (abortError as Error).stack,
          }
        );
      }
    }

    if (sessionProof.inTransaction()) {
      try {
        await sessionProof.abortTransaction();
      } catch (abortError) {
        logger.error(
          'DatabaseEngine::withCompoundTransaction() - Abort failed for proof',
          {
            message: (abortError as MongoError).message,
            code: (abortError as MongoError).code,
            stack: (abortError as Error).stack,
          }
        );
      }
    }

    throw error;
  } finally {
    await sessionService.endSession();
    await sessionProof.endSession();
  }

  return result;
}
