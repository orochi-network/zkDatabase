import { Condition, Search } from '@zkdb/api';
import { SearchInput } from '../../sdk/query/builder/query-builder.js';

export default function mapSearchInputToSearch<T>(
  searchInput?: SearchInput<T>
): Search | undefined {
  if (!searchInput) {
    return undefined;
  }

  const { and, or, condition } = searchInput;

  if (!condition) {
    return undefined;
  }

  const mappedCondition: Condition = {
    field: condition.field as string,
    value: condition.value!.toString(),
    operator: condition.operator,
  };

  const mappedSearch: Search = {
    condition: mappedCondition,
  };

  if (and) {
    mappedSearch.and = and.map((s) => mapSearchInputToSearch<T>(s)) as [Search];
  }

  if (or) {
    mappedSearch.or = or.map((s) => mapSearchInputToSearch<T>(s)) as [Search];
  }

  return mappedSearch;
}
