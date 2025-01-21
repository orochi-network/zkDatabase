import { DATABASE_ENGINE, logger } from '@helper';
import { ClientSession, TransactionOptions } from 'mongodb';

export type TCompoundSession = {
  sessionServerless: ClientSession;
  sessionMina: ClientSession;
};

/**
 * Handles transaction abortion and logs relevant errors.
 */
export class Transaction {
  public static readonly transactionOptions: TransactionOptions = {
    readPreference: 'primary',
    readConcern: { level: 'local' },
    writeConcern: { w: 'majority' },
  };

  private static async withTransaction<T>(
    sessionName: keyof TCompoundSession,
    session: ClientSession,
    callback: (session: ClientSession) => Promise<T>
  ) {
    try {
      // Start and execute the transaction
      const result = await session.withTransaction(
        callback,
        Transaction.transactionOptions
      );

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

  public static async mina<T>(
    callback: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    return Transaction.withTransaction(
      'sessionMina',
      DATABASE_ENGINE.dbMina.client.startSession(),
      callback
    );
  }

  public static async serverless<T>(
    callback: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    return Transaction.withTransaction(
      'sessionServerless',
      DATABASE_ENGINE.dbServerless.client.startSession(),
      callback
    );
  }

  /** Creates a compound transaction across serverless and Mina clusters.
   *
   *  **IMPORTANT:** If the serverless transaction fails to commit, the mina
   *  transaction cannot be rolled back since the session has already been
   *  closed. For instance, concurrent write conflicts with other ongoing
   *  transactions may execute successfully but fail during commit. However,
   *  for typical use cases, this isn't problematic if errors are caught inside
   *  the callback, as this automatically rolls back both transactions.
   *  */
  public static async compound<T>(
    callback: (compoundSession: TCompoundSession) => Promise<T>
  ) {
    return Transaction.withTransaction(
      'sessionServerless',
      DATABASE_ENGINE.dbServerless.client.startSession(),
      async (sessionServerless) => {
        return Transaction.withTransaction(
          'sessionMina',
          DATABASE_ENGINE.dbMina.client.startSession(),
          async (sessionMina) => {
            return callback({ sessionServerless, sessionMina });
          }
        );
      }
    );
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
