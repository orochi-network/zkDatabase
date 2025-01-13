import { ClientSession, MongoError } from 'mongodb';
import { DATABASE_ENGINE, logger } from '@helper';

export type TCompoundSession = {
  serverless: ClientSession;
  proofService: ClientSession;
};

export async function withCompoundTransaction<T>(
  callback: (session: TCompoundSession) => Promise<T>
): Promise<T> {
  const serverless = DATABASE_ENGINE.serverless.client.startSession();
  const proofService = DATABASE_ENGINE.proofService.client.startSession();
  let result: T;

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

    // NOTE: (or TODO?) this has a limitation where if the serverless commit
    // succeeds but the proofService commit fails, the serverless commit will
    // not be rolled back because the session is already closed.
    await serverless.commitTransaction();
    await proofService.commitTransaction();
  } catch (error) {
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
