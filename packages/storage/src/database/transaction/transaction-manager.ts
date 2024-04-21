import { ClientSession } from "mongodb";
import { DatabaseEngine } from "../database-engine";
import logger from "../../helper/logger";

export default async function withTransaction<T>(
  callback: (session: ClientSession) => Promise<T>
): Promise<T | null> {
  const session = DatabaseEngine.getInstance().client.startSession();
  let result: T | null = null;

  try {
    result = await session.withTransaction(async () => {
      return await callback(session);
    }, {
      readPreference: 'primary',
      readConcern: { level: 'local' },
      writeConcern: { w: 'majority' }
    });

    await session.commitTransaction();
  } catch (e) {
    logger.error('DatabaseEngine::withTransaction()', e);
    await session.abortTransaction();
    result = null;
  } finally {
    await session.endSession();
  }

  return result;
}
