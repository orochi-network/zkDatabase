import { ClientSession, Document } from 'mongodb';
import { ModelCollection } from '../database/index.js';
import logger from './logger.js';

export interface AppContext {
  userName: string;
  email: string;
  sessionId: string;
}

export async function isOk(callback: () => Promise<any>): Promise<boolean> {
  try {
    await callback();
    return true;
  } catch (e) {
    logger.error(e);
    return false;
  }
}

const cache: {
  timestamp?: Date;
} = {};

export function getCurrentTime(): Date {
  if (typeof cache.timestamp === 'undefined') {
    cache.timestamp = new Date();
    // Clear cache every 2 secs
    setTimeout(() => {
      delete cache.timestamp;
    }, 2000);
  }
  return cache.timestamp;
}

export function objectToLookupPattern(obj: {
  [key: string]: any;
}): { [key: string]: any }[] {
  const entries = Object.entries(obj);
  const result = [];
  for (let i = 0; i < entries.length; i += 1) {
    result.push({ [entries[i][0]]: entries[i][1] });
  }
  return result;
}

export async function addTimestampMongoDB<T extends Document>(
  collection: ModelCollection<T>,
  session?: ClientSession
) {
  // We need to use `await` to ensures each collection.index() operation complete
  // If an error occurs, it will immediately throw an exception, which can be caught and handled rollback
  await collection.index({ createdAt: 1 }, { session });
  await collection.index({ updatedAt: 1 }, { session });
}
