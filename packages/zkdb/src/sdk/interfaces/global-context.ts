import { PublicKey } from 'o1js';
import { Database } from '../../types/database.js';
import { User } from '../../types/user.js';
import { FilterCriteria } from '../../types/common.js';

/* eslint-disable no-unused-vars */
export interface GlobalContext {
  createDatabase(
    databaseName: string,
    merkleHeight: number,
    publicKey: PublicKey
  ): Promise<boolean>;
  databases(filter?: FilterCriteria): Promise<Database[]>;
  databases(): Promise<Database[]>;
  users(filter?: FilterCriteria): Promise<User[]>;
}
