import { Database, FilterCriteria, Pagination, User } from '../../types';

/* eslint-disable no-unused-vars */
export interface ZKSystem {
  listDatabase(
    filter?: FilterCriteria,
    pagination?: Pagination
  ): Promise<Database[]>;

  listUser(filter?: FilterCriteria, pagination?: Pagination): Promise<User[]>;
}
