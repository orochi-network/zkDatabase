import { DATABASE_ENGINE, logger } from '@helper';
import { ClientSession } from 'mongodb';

export type TCompoundSession = {
  serverless: ClientSession;
  minaService: ClientSession;
};

/**
 * Handles transaction abortion and logs relevant errors.
 */
export class Transaction {
  static async minaService<T>(
    callback: (session: ClientSession) => Promise<T>
  ) {
    const minaSession = DATABASE_ENGINE.minaService.client.startSession();

    try {
      // Start and execute the transaction
      Transaction.start(minaSession);
      const result = await callback(minaSession);
      // Commit transaction
      await Transaction.commit(minaSession);

      return result;
    } catch (error) {
      // Handle transaction abort
      // Only attempt to abort if an error occurred and transaction is still active
      await Transaction.abort(minaSession, 'minaService');
      throw error;
    } finally {
      await minaSession.endSession();
    }
  }

  static async serverless<T>(callback: (session: ClientSession) => Promise<T>) {
    const serverlessSession = DATABASE_ENGINE.serverless.client.startSession();

    try {
      // Start and execute the transaction
      Transaction.start(serverlessSession);
      const result = await callback(serverlessSession);
      // Commit transaction
      await Transaction.commit(serverlessSession);

      return result;
    } catch (error) {
      // Handle transaction abort
      // Only attempt to abort if an error occurred and transaction is still active
      await Transaction.abort(serverlessSession, 'serverless');
      throw error;
    } finally {
      await serverlessSession.endSession();
    }
  }

  static async compound<T>(
    callback: (session: TCompoundSession) => Promise<T>
  ) {
    const serverlessSession = DATABASE_ENGINE.serverless.client.startSession();
    const proofServiceSession =
      DATABASE_ENGINE.minaService.client.startSession();

    try {
      Transaction.start(serverlessSession);
      Transaction.start(proofServiceSession);

      const result = await callback({
        serverless: serverlessSession,
        minaService: proofServiceSession,
      });

      // NOTE: (or TODO?) this has a limitation where if the serverless commit
      // succeeds but the minaService commit fails, the serverless commit will
      // not be rolled back because the session is already closed.
      // MongoDB does not natively support 2PC across different database clusters
      // FIXME: We can implement saga pattern in the future but it too complicated
      // Since we need to pass the undoCallback for undo transaction
      await Transaction.commit(serverlessSession);
      await Transaction.commit(proofServiceSession);

      return result;
    } catch (error) {
      await Transaction.abort(serverlessSession, 'serverless');
      await Transaction.abort(proofServiceSession, 'minaService');
      throw error;
    } finally {
      await serverlessSession.endSession();
      await proofServiceSession.endSession();
    }
  }

  /**
   * Start a transaction
   */
  private static start(session: ClientSession): void {
    session.startTransaction({
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' },
    });
  }

  /**
   * Commit a transaction
   */
  private static async commit(session: ClientSession): Promise<void> {
    await session.commitTransaction();
  }

  /**
   * Safely abort a transaction and logs an error if the abort fail
   */
  private static async abort(
    session: ClientSession,
    sessionName: keyof TCompoundSession
  ): Promise<void> {
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        logger.error(
          `TransactionManager::safelyAbortTransaction() - Abort failed for ${sessionName} session`,
          abortError
        );
      }
    }
  }
}
