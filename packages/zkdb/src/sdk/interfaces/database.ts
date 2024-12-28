/* eslint-disable no-unused-vars */
import {
  ETransactionType,
  TDatabaseCreateRequest,
  TGroupRecord,
  TProofStatusDatabaseResponse,
  TRollUpHistoryResponse,
  TSchemaExtendable,
  TTransactionDraftResponse,
  TUser,
  TUserRecord,
  TZkProofResponse,
} from '@zkdb/common';
import { ICollection } from './collection';
import { IGroup } from './group';
import { IUser } from './user';

export type TDatabaseConfig = Pick<TDatabaseCreateRequest, 'merkleHeight'>;

export interface IDatabase {
  // Database
  create(config: TDatabaseConfig): Promise<boolean>;

  exist(): Promise<boolean>;

  // Collection
  collection<T extends TSchemaExtendable<any>>(
    collectionName: string
  ): ICollection<T>;

  collectionList(): Promise<string[]>;

  // Group
  group(groupName: string): IGroup;

  groupList(): Promise<TGroupRecord[]>;

  // User
  user(
    userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>
  ): IUser;

  userList(): Promise<TUserRecord[]>;

  // ZK Proof
  proofZk(): Promise<TZkProofResponse>;

  proofStatus(): Promise<TProofStatusDatabaseResponse>;

  // Transaction
  transactionDraft(
    transactionType: ETransactionType
  ): Promise<TTransactionDraftResponse>;

  transactionSubmit(id: string, txHash: string): Promise<boolean>;

  // Rollup
  rollUpStart(): Promise<boolean>;

  rollUpHistory(): Promise<TRollUpHistoryResponse>;
}
