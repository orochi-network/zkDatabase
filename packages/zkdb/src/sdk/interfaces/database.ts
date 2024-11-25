/* eslint-disable no-unused-vars */
import { JsonProof } from 'o1js';
import {
  Database,
  DatabaseSettings,
  FilterCriteria,
  GroupDescription,
  Pagination,
  TDbTransaction,
  TGetRollUpHistory,
  TTransactionType,
  User,
} from '../../types';
import { ZKCollection } from './collection';
import { ZKGroup } from './group';
import { ZKSystem } from './system';

export interface ZKDatabaseConfig {
  merkleHeight: number;
}

export interface ZKDatabase {
  get system(): ZKSystem;

  // Database
  create(config: ZKDatabaseConfig): Promise<boolean>;

  // TODO: Implement exists endpoint
  // exists(): Promise<boolean>;

  // Collection
  collection(name: string): ZKCollection;
  listCollection(): Promise<string[]>;

  // Group
  group(groupName: string): ZKGroup;
  listGroup(): Promise<GroupDescription[]>;

  // Settings
  setting(): Promise<DatabaseSettings>;

  // Ownership
  changeOwner(newOwner: string): Promise<boolean>;

  // Proof
  getProof(): Promise<JsonProof>;

  // Transaction
  getTransaction(transactionType: TTransactionType): Promise<TDbTransaction>;
  confirmTransaction(id: string, txHash: string): Promise<boolean>;

  // Rollup
  createRollup(): Promise<boolean>;
  getRollUpHistory(): Promise<TGetRollUpHistory>;
}
