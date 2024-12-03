import { SearchInput } from '@zkdb/common';
import { Condition } from 'mongodb';

export default function mapSearchToQueryOptions<T>(
  search: Search
): SearchInput<T> | undefined {
  if (search) {
    const { and, or, condition } = search;

    const mappedCondition: Condition<T> | undefined = condition
      ? {
          field: condition.field as keyof T,
          value: condition.value,
          operator: condition.operator as
            | 'eq'
            | 'ne'
            | 'gt'
            | 'lt'
            | 'gte'
            | 'lte',
        }
      : undefined;

    const mappedAnd = and
      ? (and
          .map((s) => mapSearchToQueryOptions<T>(s))
          .filter(Boolean) as SearchInput<T>[])
      : undefined;

    const mappedOr = or
      ? (or
          .map((s) => mapSearchToQueryOptions<T>(s))
          .filter(Boolean) as SearchInput<T>[])
      : undefined;

    return {
      and: mappedAnd,
      or: mappedOr,
      condition: mappedCondition,
    };
  }
  return undefined;
}
