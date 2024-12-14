import { ClientSession, MongoError } from 'mongodb';
import { DATABASE_ENGINE } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';

export type CompoundSession = {
  sessionService: ClientSession;
  sessionProof: ClientSession;
};

export async function withCompoundTransaction<T>(
  callback: (session: CompoundSession) => Promise<T>
): Promise<T | null> {
  const sessionService = DATABASE_ENGINE.serverless.client.startSession();
  const sessionProof = DATABASE_ENGINE.proofService.client.startSession();
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
          abortError
        );
      }
    }

    if (sessionProof.inTransaction()) {
      try {
        await sessionProof.abortTransaction();
      } catch (abortError) {
        logger.error(
          'DatabaseEngine::withCompoundTransaction() - Abort failed for proof',
          abortError
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
