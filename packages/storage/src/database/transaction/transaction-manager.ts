import { DATABASE_ENGINE, logger } from '@helper';
import { ClientSession } from 'mongodb';

export type TCompoundSession = {
  sessionServerless: ClientSession;
  sessionMina: ClientSession;
};

/**
 * Handles transaction abortion and logs relevant errors.
 */
export class Transaction {
  private static async withTransaction<T>(
    sessionName: keyof TCompoundSession,
    session: ClientSession,
    callback: (session: ClientSession) => Promise<T>
  ) {
    try {
      // Start and execute the transaction
      Transaction.start(session);
      const result = await callback(session);
      // Commit transaction
      await session.commitTransaction();

      return result;
    } catch (error) {
      // Handle transaction abort
      // Only attempt to abort if an error occurred and transaction is still active
      await Transaction.abort(session, sessionName);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  static async mina<T>(
    callback: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    return Transaction.withTransaction(
      'sessionMina',
      DATABASE_ENGINE.dbMina.client.startSession(),
      callback
    );
  }

  static async serverless<T>(
    callback: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    return Transaction.withTransaction(
      'sessionServerless',
      DATABASE_ENGINE.dbServerless.client.startSession(),
      callback
    );
  }

  static async compound<T>(
    callback: (compoundSession: TCompoundSession) => Promise<T>
  ) {
    const sessionServerless =
      DATABASE_ENGINE.dbServerless.client.startSession();
    const sessionMina = DATABASE_ENGINE.dbMina.client.startSession();

    try {
      Transaction.start(sessionServerless);
      Transaction.start(sessionMina);

      const result = await callback({
        sessionServerless,
        sessionMina,
      });

      // NOTE: (or TODO?) this has a limitation where if the serverless commit
      // succeeds but the minaService commit fails, the serverless commit will
      // not be rolled back because the session is already closed.
      // MongoDB does not natively support 2PC across different database clusters
      // FIXME: We can implement saga pattern in the future but it too complicated
      // Since we need to pass the undoCallback for undo transaction
      await sessionServerless.commitTransaction();
      await sessionMina.commitTransaction();

      return result;
    } catch (error) {
      await Transaction.abort(sessionServerless, 'sessionServerless');
      await Transaction.abort(sessionMina, 'sessionServerless');
      throw error;
    } finally {
      await sessionServerless.endSession();
      await sessionMina.endSession();
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
   * Safely abort a transaction and logs an error if the abort fail
   */
  private static async abort(
    session: ClientSession,
    sessionName: keyof TCompoundSession
  ): Promise<void> {
    if (session.inTransaction()) {
      try {
        await session.abortTransaction();
        logger.debug(
          `TransactionManager::abort() - Abort success for ${sessionName} session`
        );
      } catch (abortError) {
        logger.error(
          `TransactionManager::abort() - Abort failed for ${sessionName} session`,
          abortError
        );
      }
    }
  }
}
