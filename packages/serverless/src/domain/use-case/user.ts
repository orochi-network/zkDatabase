import { ClientSession } from 'mongodb';
import ModelUser from '../../model/global/user.js';
import buildMongoQuery from '../query/mongodb-filter.js';
import { SearchInput } from '../types/search.js';
import { Pagination } from '../types/pagination.js';
import { User } from '../types/user.js';

// eslint-disable-next-line import/prefer-default-export
export async function searchUsers(
  query?: SearchInput<User>,
  pagination?: Pagination,
  session?: ClientSession
): Promise<User[]> {
  const modelUser = new ModelUser();

  const options: any = {};
  if (pagination) {
    options.limit = pagination.limit;
    options.skip = pagination.offset;
  }

  return (
    await modelUser.find(buildMongoQuery(query) || {}, {
      session,
      ...options,
    })
  ).toArray();
}
