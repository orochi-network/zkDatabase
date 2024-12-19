import { ClientSession, MongoError } from 'mongodb';
import {
  DATABASE_ENGINE,
  TDatabaseEngineStaticInstance,
  logger,
} from '@helper';

export async function withTransaction<T>(
  callback: (session: ClientSession) => Promise<T>,
  type: keyof TDatabaseEngineStaticInstance = 'serverless'
): Promise<T> {
  const session = DATABASE_ENGINE[type].client.startSession();
  let result: T;
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

    return result;
  } catch (error) {
    // Log the error and handle the transaction abort
    logger.error('DatabaseEngine::withTransaction()', error);

    // Only attempt to abort if an error occurred and transaction is still active
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        // Log the abort error and rethrow the original error
        logger.error(
          'DatabaseEngine::withTransaction() - Abort failed',
          abortError
        );
        throw error;
      }
    }

    throw error;
  } finally {
    await session.endSession();
  }
}
