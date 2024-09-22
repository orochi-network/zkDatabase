import { searchUsers } from '@zkdb/api';
import { User } from '../types/user.js';
import { FilterCriteria } from '../types/common.js';
import { Pagination } from '../types/pagination.js';

export async function findUsers(
  filter?: FilterCriteria,
  pagination?: Pagination
): Promise<User[]> {
  const result = await searchUsers({
    documentQuery: filter ?? {},
    pagination: pagination ?? {
      limit: 10,
      offset: 0,
    },
  });

  return result.unwrap();
}
