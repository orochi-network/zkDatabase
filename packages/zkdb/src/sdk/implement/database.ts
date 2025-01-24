import { IApiClient } from '@zkdb/api';
import {
  ETransactionType,
  TCollectionListResponse,
  TDatabaseInfoResponse,
  TGroupListAllResponse,
  TPagination,
  TRollupOffChainHistoryResponse,
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
import {
  ICollection,
  IDatabase,
  IGroup,
  IUser,
  TDatabaseConfig,
} from '../interfaces';
import { Collection } from './collection';
import { Group } from './group';
import { User } from './user';

// TODO: Implement transactions endpoints
export class Database implements IDatabase {
  private databaseName: string;

  private apiClient: IApiClient;

  constructor(apiClient: IApiClient, databaseName: string) {
    this.apiClient = apiClient;
    this.databaseName = databaseName;
  }

  private get basicQuery() {
    return { databaseName: this.databaseName };
  }

  async create(config: TDatabaseConfig): Promise<boolean> {
    return (
      await this.apiClient.db.dbCreate({
        databaseName: this.databaseName,
        merkleHeight: config.merkleHeight,
      })
    ).unwrap();
  }

  async exist(): Promise<boolean> {
    return (await this.apiClient.db.dbExist(this.basicQuery)).unwrap();
  }

  collection<T extends TSchemaExtendable<any>>(
    collectionName: string
  ): ICollection<T> {
    return new Collection(this.apiClient, this.databaseName, collectionName);
  }

  async collectionList(): Promise<string[]> {
    const result: TCollectionListResponse = (
      await this.apiClient.collection.collectionList(this.basicQuery)
    ).unwrap();

    return result.map((e) => e.collectionName);
  }

  group(groupName: string): IGroup {
    return new Group(this.apiClient, this.databaseName, groupName);
  }

  async groupList(): Promise<TGroupListAllResponse> {
    return (await this.apiClient.group.groupListAll(this.basicQuery)).unwrap();
  }

  user(
    userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>
  ): IUser {
    return new User(this.apiClient, this.databaseName, userFilter);
  }

  async userList(offset?: number): Promise<TUserFindResponse> {
    return (
      await this.apiClient.user.userFind({
        query: {},
        pagination: { limit: 100, offset: offset || 0 },
      })
    ).unwrap();
  }

  async zkProof(): Promise<TZkProofResponse> {
    const result = await this.apiClient.proof.zkProof(this.basicQuery);
    if (result.isValid()) {
      return result.unwrap();
    }
    if (result.isUndefined()) {
      return null;
    }
    throw result.unwrap();
  }

  async zkProofStatus(): Promise<TZkProofStatusResponse> {
    return (await this.apiClient.proof.zkProofStatus(this.basicQuery)).unwrap();
  }

  async transactionDraft(
    transactionType: ETransactionType
  ): Promise<TTransactionDraftResponse> {
    return (
      await this.apiClient.transaction.transactionDraft({
        ...this.basicQuery,
        transactionType,
      })
    ).unwrap();
  }

  async transactionSubmit(
    rawTransactionId: string,
    txHash: string
  ): Promise<boolean> {
    return (
      await this.apiClient.transaction.transactionSubmit({
        ...this.basicQuery,
        rawTransactionId,
        txHash,
      })
    ).unwrap();
  }

  async rollUpOnChainStart(): Promise<boolean> {
    return (await this.apiClient.rollup.rollupCreate(this.basicQuery)).unwrap();
  }

  async rollUpOnChainHistory(
    pagination?: TPagination
  ): Promise<TRollupOnChainHistoryResponse> {
    return (
      await this.apiClient.rollup.rollupOnChainHistory({
        databaseName: this.basicQuery.databaseName,
        pagination: pagination ?? { limit: 10, offset: 0 },
      })
    ).unwrap();
  }

  async rollUpOffChainHistory(
    pagination?: TPagination
  ): Promise<TRollupOffChainHistoryResponse> {
    return (
      await this.apiClient.rollup.rollupOffChainHistory({
        databaseName: this.basicQuery.databaseName,
        pagination: pagination ?? { limit: 10, offset: 0 },
      })
    ).unwrap();
  }

  async rollUpOnChainState(): Promise<TRollupOnChainStateResponse> {
    const result = await this.apiClient.rollup.rollupOnChainState(
      this.basicQuery
    );
    if (result.isValid()) {
      return result.unwrap();
    }
    if (result.isUndefined()) {
      return null;
    }
    throw result.unwrap();
  }

  async verificationKey(): Promise<TVerificationKeyResponse> {
    return (
      await this.apiClient.db.dbVerificationKey(this.basicQuery)
    ).unwrap();
  }

  async info(): Promise<TDatabaseInfoResponse> {
    return (await this.apiClient.db.dbInfo(this.basicQuery)).unwrap();
  }
}
