import { UserSearch } from '../types/search.js';
import { searchUsers } from '@zkdb/api';
import { QueryOptions } from '../sdk/query/query-builder.js';
import { User } from '../types/user.js';
import mapSearchInputToSearch from './mapper/search.js';

export async function findUsers(
  queryOptions?: QueryOptions<UserSearch>
): Promise<User[]> {
  const result = await searchUsers(
    queryOptions ? mapSearchInputToSearch(queryOptions.where) : undefined,
    queryOptions?.limit
      ? {
          limit: queryOptions.limit,
          offset: queryOptions.offset ?? 0,
        }
      : undefined
  );

  if (result.isSome()) {
    return result.unwrapArray();
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}
