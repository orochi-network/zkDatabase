import { PublicKey } from 'o1js';
import { Database } from '../../types/database.js';
import { User } from '../../types/user.js';
import { FilterCriteria } from '../../types/common.js';
import { Pagination } from '../../types/pagination.js';

/* eslint-disable no-unused-vars */
export interface GlobalContext {
  createDatabase(
    databaseName: string,
    merkleHeight: number,
    publicKey: PublicKey
  ): Promise<boolean>;
  databases(
    filter?: FilterCriteria,
    pagination?: Pagination
  ): Promise<Database[]>;
  users(filter?: FilterCriteria, pagination?: Pagination): Promise<User[]>;
}
