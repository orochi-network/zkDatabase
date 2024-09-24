import { User } from '../types/user.js';
import { FilterCriteria } from '../types/common.js';
import { Pagination } from '../types/pagination.js';
import { AppContainer } from 'src/container.js';

export async function findUsers(
  filter?: FilterCriteria,
  pagination?: Pagination
): Promise<User[]> {
  const result = await AppContainer.getInstance().getApiClient().user.findMany({
    query: filter ?? {},
    pagination: pagination ?? {
      limit: 10,
      offset: 0,
    },
  });

  return result.unwrap();
}
