/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { PublicKey } from 'o1js';
import { GlobalContext } from '../interfaces/global-context.js';
import { createDatabase, getDatabases } from '../../repository/database.js';
import { findUsers } from '../../repository/user.js';
import { DatabaseSearch, UserSearch } from '../../types/search.js';
import { QueryOptions } from '../query/query-builder.js';
import { User } from '../../types/user.js';
import { Database } from '../../types/database.js';

export class GlobalContextImpl implements GlobalContext {
  async databases(): Promise<Database[]>;
  async databases(
    queryOptions: QueryOptions<DatabaseSearch>
  ): Promise<Database[]>;

  async databases(queryOptions?: QueryOptions<DatabaseSearch>): Promise<Database[]> {
    return getDatabases(queryOptions);
  }

  async users(queryOptions?: QueryOptions<UserSearch>): Promise<User[]> {
    return findUsers(queryOptions)
  }
  
  async createDatabase(
    databaseName: string,
    merkleHeight: number,
    publicKey: PublicKey
  ): Promise<boolean> {
    return createDatabase(databaseName, merkleHeight, publicKey);
  }
}
