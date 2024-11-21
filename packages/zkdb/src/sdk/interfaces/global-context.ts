import { Database, FilterCriteria, Pagination, User } from '../../types';

/* eslint-disable no-unused-vars */
export interface GlobalContext {
  createDatabase(databaseName: string, merkleHeight: number): Promise<boolean>;
  databases(
    filter?: FilterCriteria,
    pagination?: Pagination
  ): Promise<Database[]>;
  users(filter?: FilterCriteria, pagination?: Pagination): Promise<User[]>;
}
