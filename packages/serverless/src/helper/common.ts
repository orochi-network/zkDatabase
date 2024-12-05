import {
  ESorting,
  TCollectionIndex,
  TCollectionIndexSpecification,
  TSchemaFieldDefinition,
} from '@zkdb/common';
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

export const formatIndexSpecification = (
  index: TCollectionIndex
): TCollectionIndexSpecification => {
  const result: TCollectionIndexSpecification = {};
  for (const key in index) {
    if (index[key]) {
      result[key] =
        index[key] === ESorting.Asc
          ? 1
          : index[key] === ESorting.Desc
            ? -1
            : index[key] === 'text'
              ? 'text'
              : undefined;
    }
  }
  return result;
};
/**
 * Generates an array of indexed field definitions based on a schema.
 *
 * @param schema - An array of schema field definitions, where each field includes
 * properties such as `order`, `index`, `sorting`, and `name`.
 *
 * @returns An array of objects, where each object is of type `Partial<Record<string, ESorting>>`.
 * Each object contains a single field name as the key and its sorting order (`ESorting`)
 * as the value.
 *
 * @example
 * ```typescript
 * const schema: TSchemaFieldDefinition[] = [
 *   { order: 1, index: true, sorting: ESorting.Asc, name: "field1", kind: "CircuitString" },
 *   { order: 2, index: false, sorting: ESorting.Desc, name: "field2", kind: "CircuitString" },
 *   { order: 3, index: true, sorting: ESorting.Desc, name: "field3", kind: "CircuitString" },
 * ];
 *
 * const result = getIndexCollectionBySchemaDefinition(schema);
 * console.log(result);
 * // Output:
 * //
 * //   { field1: 1, field3: -1 },
 * //
 * ```
 */

export const getIndexCollectionBySchemaDefinition = <T = Record<string, any>>(
  schema: TSchemaFieldDefinition[]
): TCollectionIndexSpecification<T> => {
  return schema
    .filter((field) => field.index && field.sorting) // Filter out fields that aren't indexed or sorted
    .reduce<TCollectionIndexSpecification<T>>((acc, field) => {
      acc[field.name as keyof T] = field.sorting === ESorting.Asc ? 1 : -1;
      return acc;
    }, {});
};
