import { PublicKey } from 'o1js';
import { Database, User, FilterCriteria, Pagination } from '../../types';

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
