/* eslint-disable no-unused-vars */
import { JsonProof } from 'o1js';
import { ZKCollection } from './collection';
import { SchemaDefinition } from '../schema';
import { ZKGroup } from './group';
import {
  DatabaseSettings,
  GroupDescription,
  Permissions,
  TTransactionType,
  IndexField,
  TDbTransaction,
  TGetRollUpHistory,
} from '../../types';
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
  confirmTransaction(
    databaseName: string,
    id: string,
    txHash: string
  ): Promise<boolean>;

  // Rollup
  createRollup(databaseName: string): Promise<boolean>;
  getRollUpHistory(databaseName: string): Promise<TGetRollUpHistory>;
}
