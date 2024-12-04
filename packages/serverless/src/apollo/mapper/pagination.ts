import { TPagination } from '@zkdb/common';

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

export default function mapPagination(pagination: TPagination): TPagination {
  if (!pagination) {
    return {
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET,
    };
  }

  return {
    limit: pagination.limit,
    offset: pagination.offset,
  };
}
