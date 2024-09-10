import { Pagination } from '../../domain/types/pagination.js';
import { Pagination as PaginationPayload } from '../types/pagination.js';

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

export default function mapPagination(
  pagination: PaginationPayload
): Pagination {
  if (!pagination) {
    return {
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET
    };
  }

  return {
    limit: pagination.limit,
    offset: pagination.offset
  }
}
