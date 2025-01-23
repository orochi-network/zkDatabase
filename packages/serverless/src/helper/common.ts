import { ModelDocument } from '@model';
import { EIndexType, TCollectionIndexMap } from '@zkdb/common';
import { IndexDirection } from 'mongodb';

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
    const val = value === EIndexType.Asc ? 1 : -1;
    return { ...acc, [ModelDocument.indexKeyFormat(key)]: val };
  }, {});

export const convertIndexToGraphqlFormat = (
  index: Record<string, IndexDirection>
): Record<string, EIndexType> =>
  Object.entries(index).reduce((acc, [key, value]) => {
    const val = value ? EIndexType.Asc : EIndexType.Desc;
    return { ...acc, [key]: val };
  }, {});
