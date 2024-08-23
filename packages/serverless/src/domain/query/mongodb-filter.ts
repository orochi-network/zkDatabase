import { SearchInput } from "../types/search.js";

export default function buildMongoQuery<T>(searchInput?: SearchInput<T>): any {
  if (!searchInput) {
    return {};
  }

  const mongoQuery: any = {};

  if (searchInput.condition) {
    const { field, value, operator } = searchInput.condition;

    switch (operator) {
      case 'eq':
        mongoQuery[field as string] = value;
        break;
      case 'ne':
        mongoQuery[field as string] = { $ne: value };
        break;
      case 'gt':
        mongoQuery[field as string] = { $gt: value };
        break;
      case 'lt':
        mongoQuery[field as string] = { $lt: value };
        break;
      case 'gte':
        mongoQuery[field as string] = { $gte: value };
        break;
      case 'lte':
        mongoQuery[field as string] = { $lte: value };
        break;
      case 'contains':
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
