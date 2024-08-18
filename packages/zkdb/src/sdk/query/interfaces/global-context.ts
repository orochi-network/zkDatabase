import { PublicKey } from 'o1js';
import { QueryOptions } from '../builder/query-builder.js';
import { Database } from '../../../types/database.js';
import { User } from '../../../types/user.js';
import { UserSearch, DatabaseSearch } from '../../../types/search.js';

/* eslint-disable no-unused-vars */
export interface GlobalContext {
  newDatabase(
    databaseName: string,
    merkleHeight: number,
    publicKey: PublicKey
  ): Promise<void>;
  databases(queryOptions: QueryOptions<DatabaseSearch>): Promise<Database[]>;
  databases(): Promise<Database[]>;
  users(queryOptions?: QueryOptions<UserSearch>): Promise<User[]>
}
