import { ClientSession, MongoError } from 'mongodb';
import { DB } from '../../helper/db-instance.js';
import logger from '../../helper/logger.js';

export default async function withTransaction<T>(
  callback: (session: ClientSession) => Promise<T>,
  type: 'service' | 'proof' = 'service'
): Promise<T | null> {
  const session = DB[type].client.startSession();
  let result: T | null = null;
  try {
    result = await session.withTransaction(
      async () => {
        return await callback(session);
      },
      {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      }
    );

    // If the transaction has succeeded, commit it
    await session.commitTransaction();
  } catch (error) {
    // Log the error and handle the transaction abort
    logger.error('DatabaseEngine::withTransaction()', {
      message: (error as MongoError).message,
      code: (error as MongoError).code,
      stack: (error as Error).stack,
    });

    // Only attempt to abort if an error occurred and transaction is still active
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        // Log the abort error and rethrow the original error
        logger.error('DatabaseEngine::withTransaction() - Abort failed', {
          message: (abortError as MongoError).message,
          code: (abortError as MongoError).code,
          stack: (abortError as Error).stack,
        });
        throw error;
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return result;
}
