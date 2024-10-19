import { PublicKey } from 'o1js';
import { Database, User, FilterCriteria, Pagination } from '../../types';
import { NetworkId } from '../../types/network';

/* eslint-disable no-unused-vars */
export interface GlobalContext {
  createDatabase(
    databaseName: string,
    merkleHeight: number,
    publicKey: PublicKey,
    networkId: NetworkId
  ): Promise<boolean>;
  databases(
    filter?: FilterCriteria,
    pagination?: Pagination
  ): Promise<Database[]>;
  users(filter?: FilterCriteria, pagination?: Pagination): Promise<User[]>;
}
