import { IApiClient } from '@zkdb/api';
import {
  ETransactionType,
  TCollectionListResponse,
  TDatabaseInfoResponse,
  TDatabaseMerkleProofStatusResponse,
  TGroupListAllResponse,
  TRollupHistoryResponse,
  TSchemaExtendable,
  TTransactionDraftResponse,
  TUser,
  TUserFindResponse,
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

  async merkleProofStatus(): Promise<TDatabaseMerkleProofStatusResponse> {
    return (
      await this.apiClient.document.databaseMerkleProofStatus(this.basicQuery)
    ).unwrap();
  }

  async zkProof(): Promise<TZkProofResponse> {
    return (await this.apiClient.proof.proof(this.basicQuery)).unwrap();
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
    transactionObjectId: string,
    txHash: string
  ): Promise<boolean> {
    return (
      await this.apiClient.transaction.transactionSubmit({
        ...this.basicQuery,
        transactionObjectId,
        txHash,
      })
    ).unwrap();
  }

  async rollUpStart(): Promise<boolean> {
    return (await this.apiClient.rollup.rollupCreate(this.basicQuery)).unwrap();
  }

  async rollUpHistory(offset?: number): Promise<TRollupHistoryResponse> {
    return (
      await this.apiClient.rollup.rollupHistory({
        query: this.basicQuery,
        pagination: { offset: offset || 0, limit: 100 },
      })
    ).unwrap();
  }

  async info(): Promise<TDatabaseInfoResponse> {
    return (await this.apiClient.db.dbInfo(this.basicQuery)).unwrap();
  }
}
