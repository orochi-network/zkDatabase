/* eslint-disable no-unused-vars */
import { JsonProof } from 'o1js';
import {
  DatabaseSettings,
  GroupDescription,
  IndexField,
  Permissions,
  TDbTransaction,
  TGetRollUpHistory,
  TTransactionType,
} from '../../types';
import { SchemaDefinition } from '../schema';
import { ZKCollection } from './collection';
import { ZKGroup } from './group';
export interface ZKDatabase {
  from(name: string): ZKCollection;
  // Group
  createGroup(groupName: string, description: string): Promise<boolean>;
  fromGroup(groupName: string): ZKGroup;
  getGroups(): Promise<GroupDescription[]>;
  // Settings
  getSettings(): Promise<DatabaseSettings>;
  // Collection
  getCollections(): Promise<string[]>;
  createCollection<
    T extends {
      getSchema: () => SchemaDefinition;
    },
  >(
    collectionName: string,
    groupName: string,
    type: T,
    indexes: IndexField[],
    permissions: Permissions
  ): Promise<boolean>;
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
