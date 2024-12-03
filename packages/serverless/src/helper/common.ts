import { TCollectionIndex } from '../types/collection.js';
import { TSchemaFieldDefinition } from '../types/schema.js';
import logger from './logger.js';

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

// During tests causing: Jest has detected the following 1 open handle potentially keeping Jest from exiting
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

export function objectToLookupPattern(
  obj: {
    [key: string]: any;
  },
  options?: {
    regexSearch: boolean;
  }
): { [key: string]: any }[] {
  const entries = Object.entries(obj);
  const result = [];
  for (let i = 0; i < entries.length; i += 1) {
    result.push({
      [entries[i][0]]: options?.regexSearch
        ? new RegExp(entries[i][1])
        : entries[i][1],
    });
  }
  return result;
}

export const gql = (...args: any[]): string => args.join('\n');

export const getIndexCollectionBySchemaDefinition = (
  schema: TSchemaFieldDefinition[]
): TCollectionIndex[] => {
  return schema.reduce<TCollectionIndex[]>((acc, current) => {
    if (current.indexed && current.sorting) {
      acc.push({ name: current.name, sorting: current.sorting });
    }
    return acc;
  }, []);
};
