import { MongoError, ClientSession } from 'mongodb';

type DatabaseSession = {
  name: string; // Identifier for the session
  session: ClientSession;
};

export class TransactionManager {
  private static sessions: DatabaseSession[] = [];

  // Add a database session to the manager
  public static addSession(...args: DatabaseSession[]): void {
    for (let { name, session } of args) {
      TransactionManager.sessions.push({ name, session });
    }
    console.log(
      '🚀 ~ TransactionManager ~ addSession ~ args:',
      TransactionManager.sessions
    );
  }

  // Start transactions for all sessions
  public static async startTransactions(): Promise<void> {
    for (const { session } of TransactionManager.sessions) {
      session.startTransaction();
    }
  }

  // Abort all transactions
  public static async abortTransactions(): Promise<void> {
    for (const { name, session } of TransactionManager.sessions) {
      if (session.inTransaction()) {
        try {
          await session.abortTransaction();
        } catch (error) {
          console.error(
            `TransactionManager::abortTransactions() - Abort failed for ${name}`,
            {
              message: (error as MongoError).message,
              code: (error as MongoError).code,
              stack: (error as Error).stack,
            }
          );
        }
      }
    }
  }

  // End all sessions
  public static async endSessions(): Promise<void> {
    for (const { session } of TransactionManager.sessions) {
      await session.endSession();
    }
    TransactionManager.sessions = []; // Clear sessions after ending
  }

  // Execute a compound transaction (multiple sessions)
  public static async withCompoundTransaction<T>(
    operation: (sessions: Record<string, ClientSession>) => Promise<T>
  ): Promise<T> {
    let result: T;
    try {
      await TransactionManager.startTransactions();
      const sessionMap = Object.fromEntries(
        TransactionManager.sessions.map(({ name, session }) => [name, session])
      );
      result = await operation(sessionMap);
      for (const { session } of TransactionManager.sessions) {
        await session.commitTransaction();
      }
    } catch (error) {
      console.error(
        'TransactionManager::withCompoundTransaction() - Error occurred',
        {
          message: (error as MongoError).message,
          code: (error as MongoError).code,
          stack: (error as Error).stack,
        }
      );
      await TransactionManager.abortTransactions();
      throw error;
    } finally {
      await TransactionManager.endSessions();
    }
    return result;
  }

  // Execute a transaction for a single database session
  public static async withSingleTransaction<T>(
    sessionName: string,
    operation: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const sessionData = TransactionManager.sessions.find(
      (s) => s.name === sessionName
    );
    console.log(
      '🚀 ~ TransactionManager ~ TransactionManager.sessions:',
      TransactionManager.sessions
    );
    if (!sessionData) {
      throw new Error(`Session with name "${sessionName}" not found.`);
    }

    const { session } = sessionData;
    let result: T;

    try {
      session.startTransaction();
      result = await operation(session);
      await session.commitTransaction();
    } catch (error) {
      console.error(
        `TransactionManager::withSingleTransaction() - Error in session "${sessionName}"`,
        {
          message: (error as MongoError).message,
          code: (error as MongoError).code,
          stack: (error as Error).stack,
        }
      );

      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      throw error;
    } finally {
      await session.endSession();
      TransactionManager.sessions = TransactionManager.sessions.filter(
        (s) => s.name !== sessionName
      ); // Remove session after use
    }

    return result;
  }
}
