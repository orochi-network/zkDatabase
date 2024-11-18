import { MongoError, ClientSession } from 'mongodb';

interface DatabaseSession {
  name: string; // Identifier for the session
  session: ClientSession;
}

export class TransactionManager {
  private static sessions: DatabaseSession[] = [];

  // Add a database session to the manager
  public static addSession(name: string, session: ClientSession): void {
    this.sessions.push({ name, session });
  }

  // Start transactions for all sessions
  public static async startTransactions(): Promise<void> {
    for (const { session } of this.sessions) {
      session.startTransaction();
    }
  }

  // Abort all transactions
  public static async abortTransactions(): Promise<void> {
    for (const { name, session } of this.sessions) {
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
    for (const { session } of this.sessions) {
      await session.endSession();
    }
    this.sessions = []; // Clear sessions after ending
  }

  // Execute a compound transaction (multiple sessions)
  public static async withCompoundTransaction<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    let result: T;
    try {
      await this.startTransactions();
      result = await operation();
      for (const { session } of this.sessions) {
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
      await this.abortTransactions();
      throw error;
    } finally {
      await this.endSessions();
    }
    return result;
  }

  // Execute a transaction for a single database session
  public static async withSingleTransaction<T>(
    sessionName: string,
    operation: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const sessionData = this.sessions.find((s) => s.name === sessionName);
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
      this.sessions = this.sessions.filter((s) => s.name !== sessionName); // Remove session after use
    }

    return result;
  }
}
