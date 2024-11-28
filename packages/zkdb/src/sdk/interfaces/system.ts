import { TUser } from '@zkdb/api';
import { Database, FilterCriteria, Pagination, User } from '../../types';

/* eslint-disable no-unused-vars */
export interface ZKSystem {
  listDatabase(
    filter?: FilterCriteria,
    pagination?: Pagination
  ): Promise<Database[]>;

  listUser(filter?: Partial<TUser>, pagination?: Pagination): Promise<User[]>;

  getUser(filter: Partial<TUser>): Promise<User | undefined>;

  userExist(filter: Partial<TUser>): Promise<boolean>;
}
