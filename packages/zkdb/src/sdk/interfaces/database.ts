/* eslint-disable no-unused-vars */
import { JsonProof } from 'o1js';
import {
  DatabaseSettings,
  GroupDescription,
  TDbTransaction,
  TGetRollUpHistory,
  TTransactionType,
} from '../../types';
import { ZKCollection } from './collection';
import { ZKGroup } from './group';

export interface ZKDatabaseConfig {
  merkleHeight: number;
}

export interface ZKDatabase {
  // Database
  create(config: ZKDatabaseConfig): Promise<boolean>;

  exist(): Promise<boolean>;

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
