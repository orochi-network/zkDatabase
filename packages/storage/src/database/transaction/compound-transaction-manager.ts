import { ClientSession, MongoError } from 'mongodb';
import { DATABASE_ENGINE, logger } from '@helper';

export type CompoundSession = {
  serverless: ClientSession;
  proofService: ClientSession;
};

export async function withCompoundTransaction<T>(
  callback: (session: CompoundSession) => Promise<T>
): Promise<T | null> {
  const serverless = DATABASE_ENGINE.serverless.client.startSession();
  const proofService = DATABASE_ENGINE.proofService.client.startSession();
  let result: T | null = null;

  try {
    serverless.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    });
    proofService.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    });

    result = await callback({ serverless, proofService });

    await serverless.commitTransaction();
    await proofService.commitTransaction();
  } catch (error) {
    logger.error('DatabaseEngine::withCompoundTransaction()', {
      message: (error as MongoError).message,
      code: (error as MongoError).code,
      stack: (error as Error).stack,
    });
    if (serverless.inTransaction()) {
      try {
        await serverless.abortTransaction();
      } catch (abortError) {
        logger.error(
          'DatabaseEngine::withCompoundTransaction() - Abort failed for service',
          abortError
        );
      }
    }

    if (proofService.inTransaction()) {
      try {
        await proofService.abortTransaction();
      } catch (abortError) {
        logger.error(
          'DatabaseEngine::withCompoundTransaction() - Abort failed for proof',
          abortError
        );
      }
    }

    throw error;
  } finally {
    await serverless.endSession();
    await proofService.endSession();
  }

  return result;
}
