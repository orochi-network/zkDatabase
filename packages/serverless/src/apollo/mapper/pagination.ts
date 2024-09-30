import { Pagination } from '@domain';
import { Pagination as PaginationPayload } from '../types';

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

export function mapPagination(pagination: PaginationPayload): Pagination {
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

export default mapPagination;
