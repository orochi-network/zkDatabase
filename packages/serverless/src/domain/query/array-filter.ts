import { ESearchOperator, QueryOption, TCondition } from '@zkdb/common';

const MAX_RECURSION_DEPTH = 10;

function applyCondition<T>(item: T, condition: TCondition<T>): boolean {
  const { field, value, operator } = condition;

  switch (operator) {
    case ESearchOperator.Eq:
      return item[field] === value;
    case ESearchOperator.Ne:
      return item[field] !== value;
    case ESearchOperator.Gt:
      return item[field] > value;
    case ESearchOperator.Lt:
      return item[field] < value;
    case ESearchOperator.Gte:
      return item[field] >= value;
    case ESearchOperator.Lte:
      return item[field] <= value;
    case ESearchOperator.Contain:
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
  queryOptions?: QueryOption<T>,
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
