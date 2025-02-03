import {
  ETransactionType,
  TDatabaseCreateRequest,
  TDatabaseInfoResponse,
  TGroupListAllResponse,
  TPagination,
  TRollupOffChainHistoryResponse,
  TRollupOffChainStateResponse,
  TRollupOnChainHistoryResponse,
  TRollupOnChainStateResponse,
  TSchemaExtendable,
  TTransactionDraftResponse,
  TUser,
  TUserFindResponse,
  TVerificationKeyResponse,
  TZkProofResponse,
  TZkProofStatusResponse,
} from '@zkdb/common';
import { ICollection } from './collection';
import { IGroup } from './group';
import { IUser } from './user';

export type TDatabaseConfig = Pick<TDatabaseCreateRequest, 'merkleHeight'>;

export interface IDatabase {
  // Database
  create(config: TDatabaseConfig): Promise<boolean>;

  exist(): Promise<boolean>;

  info(): Promise<TDatabaseInfoResponse>;

  // Collection
  collection<T extends TSchemaExtendable<any>>(
    collectionName: string
  ): ICollection<T>;

  collectionList(): Promise<string[]>;

  // Group
  group(groupName: string): IGroup;

  groupList(): Promise<TGroupListAllResponse>;

  // User
  user(
    userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>
  ): IUser;

  userList(): Promise<TUserFindResponse>;

  // ZK Proof
  zkProof(): Promise<TZkProofResponse>;

  zkProofStatus(): Promise<TZkProofStatusResponse>;

  // Transaction
  transactionDraft(
    transactionType: ETransactionType
  ): Promise<TTransactionDraftResponse>;

  transactionSubmit(
    transactionObjectId: string,
    txHash: string
  ): Promise<boolean>;

  // Rollup
  rollUpOnChainStart(): Promise<boolean>;

  rollUpOnChainHistory(
    pagination?: TPagination
  ): Promise<TRollupOnChainHistoryResponse>;

  rollUpOffChainHistory(
    pagination?: TPagination
  ): Promise<TRollupOffChainHistoryResponse>;

  rollUpOnChainState(): Promise<TRollupOnChainStateResponse>;

  rollUpOffChainState(): Promise<TRollupOffChainStateResponse>;

  // Verification key
  verificationKey(): Promise<TVerificationKeyResponse>;
}
