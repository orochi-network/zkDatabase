import {
  ESorting,
  TCollectionIndex,
  TCollectionIndexMap,
  TSchemaFieldDefinition,
} from '@zkdb/common';
import { logger } from './logger';

export async function isOk(callback: () => Promise<any>): Promise<boolean> {
  if (typeof callback === 'function') {
    return true;
  } else {
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
  obj: Record<string, any>,
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

export const convertToIndexSpecification = <T = TCollectionIndex>(
  index: TCollectionIndex
): TCollectionIndexMap<T> => {
  const result: TCollectionIndexMap<T> = {};
  for (const key in index) {
    if (index[key]) {
      const fieldKey = `document.${key}.value` as keyof TCollectionIndexMap<T>;
      if (index[key] === ESorting.Asc) {
        result[fieldKey] =
          1 as TCollectionIndexMap<T>[keyof TCollectionIndexMap<T>];
      } else if (index[key] === ESorting.Desc) {
        result[fieldKey] =
          -1 as TCollectionIndexMap<T>[keyof TCollectionIndexMap<T>];
      }
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
 * //   { document.field1.name: 1, document.field3.name: -1 },
 * //
 * ```
 */

export const convertSchemaDefinitionToIndex = <T = TCollectionIndex>(
  schema: TSchemaFieldDefinition[]
): TCollectionIndexMap<T> => {
  const indexTmp: TCollectionIndex = schema
    .filter((field) => field.index && field.sorting) // Filter out fields that aren't indexed or sorted
    .reduce<TCollectionIndex<T>>((acc, field) => {
      acc[field.name as keyof T] = field.sorting;
      return acc;
    }, {});

  return convertToIndexSpecification(indexTmp);
};
