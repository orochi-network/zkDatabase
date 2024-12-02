import { Condition, QueryOptions } from '../../types/search.js';

const MAX_RECURSION_DEPTH = 10;

function applyCondition<T>(item: T, condition: Condition<T>): boolean {
  const { field, value, operator } = condition;

  switch (operator) {
    case 'eq':
      return item[field] === value;
    case 'ne':
      return item[field] !== value;
    case 'gt':
      return item[field] > value;
    case 'lt':
      return item[field] < value;
    case 'gte':
      return item[field] >= value;
    case 'lte':
      return item[field] <= value;
    case 'contains':
      return (
        typeof item[field] === 'string' &&
        (item[field] as unknown as string).includes(value as string)
      );
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

export default function filterItems<T>(
  items: T[],
  queryOptions?: QueryOptions<T>,
  depth: number = 0
): T[] {
  if (!queryOptions || !queryOptions.where || depth > MAX_RECURSION_DEPTH) {
    return items;
  }

  const { where } = queryOptions;

  if (where.and) {
    return items.filter((item) =>
      where.and!.every(
        (nestedWhere) =>
          filterItems([item], { where: nestedWhere }, depth + 1).length > 0
      )
    );
  }

  if (where.or) {
    return items.filter((item) =>
      where.or!.some(
        (nestedWhere) =>
          filterItems([item], { where: nestedWhere }, depth + 1).length > 0
      )
    );
  }

  if (where.condition) {
    return items.filter((item) => applyCondition(item, where.condition!));
  }

  return items;
}
