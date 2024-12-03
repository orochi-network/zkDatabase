import { ESearchOperator, SearchInput } from '@zkdb/common';

export default function buildMongoQuery<T>(searchInput?: SearchInput<T>): any {
  if (!searchInput) {
    return {};
  }

  const mongoQuery: any = {};

  if (searchInput.condition) {
    const { field, value, operator } = searchInput.condition;

    switch (operator) {
      case ESearchOperator.Eq:
        mongoQuery[field as string] = value;
        break;
      case ESearchOperator.Ne:
        mongoQuery[field as string] = { $ne: value };
        break;
      case ESearchOperator.Gt:
        mongoQuery[field as string] = { $gt: value };
        break;
      case ESearchOperator.Lt:
        mongoQuery[field as string] = { $lt: value };
        break;
      case ESearchOperator.Gte:
        mongoQuery[field as string] = { $gte: value };
        break;
      case ESearchOperator.Lte:
        mongoQuery[field as string] = { $lte: value };
        break;
      case ESearchOperator.Contain:
        mongoQuery[field as string] = { $regex: value, $options: 'i' };
        break;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  if (searchInput.and) {
    mongoQuery.$and = searchInput.and.map((input) => buildMongoQuery(input));
  }

  if (searchInput.or) {
    mongoQuery.$or = searchInput.or.map((input) => buildMongoQuery(input));
  }

  return mongoQuery;
}
