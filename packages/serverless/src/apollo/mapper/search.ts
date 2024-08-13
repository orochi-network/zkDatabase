import { Search } from '../types/search.js';
import { Condition, SearchInput } from '../../domain/types/search.js';

export default function mapSearchToQueryOptions<T>(
  search: Search
): SearchInput<T> {
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

  return {
    and: and ? and.map((s) => mapSearchToQueryOptions<T>(s)) : undefined,
    or: or ? or.map((s) => mapSearchToQueryOptions<T>(s)) : undefined,
    condition: mappedCondition,
  };
}
