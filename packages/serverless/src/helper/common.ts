import { EIndexType, TCollectionIndexMap } from '@zkdb/common';
import { IndexDirection } from 'mongodb';

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

export const convertIndexToMongoFormat = <T = any>(
  index: Record<string, EIndexType>
): TCollectionIndexMap<T> =>
  Object.entries(index).reduce((acc, [key, value]) => {
    let val = value === EIndexType.Asc ? 1 : -1;
    return { ...acc, [`database.${key}.value`]: val };
  }, {});

export const convertIndexToGraphqlFormat = (
  index: Record<string, IndexDirection>
): Record<string, EIndexType> =>
  Object.entries(index).reduce((acc, [key, value]) => {
    let val = value ? EIndexType.Asc : EIndexType.Desc;
    return { ...acc, [key]: val };
  }, {});

/**
 * Generates an array of indexed field definitions based on a schema.
 *
 * @param schema - An array of schema field definitions, where each field includes
 * properties such as `order`, `index`, `sorting`, and `name`.
 *
 * @returns An array of objects, where each object is of type `Partial<Record<string, EIndexType>>`.
 * Each object contains a single field name as the key and its sorting order (`EIndexType`)
 * as the value.
 *
 * @example
 * ```typescript
 * const schema: TSchemaSerializedFieldDefinition[] = [
 *   { order: 1, index: true, sorting: EIndexType.Asc, name: "field1", kind: "CircuitString" },
 *   { order: 2, index: false, sorting: EIndexType.Desc, name: "field2", kind: "CircuitString" },
 *   { order: 3, index: true, sorting: EIndexType.Desc, name: "field3", kind: "CircuitString" },
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
