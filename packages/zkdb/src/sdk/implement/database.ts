import { IApiClient } from '@zkdb/api';
import {
  ETransactionType,
  TGroupListAllResponse,
  TProofStatusDatabaseResponse,
  TRollupHistoryResponse,
  TSchemaExtendable,
  TTransactionDraftResponse,
  TUser,
  TUserFindResponse,
  TZkProofResponse,
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
    return (await this.apiClient.collection.collectionList(this.basicQuery))
      .unwrap()
      .map((e) => e.collectionName);
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

  async proofZk(): Promise<TZkProofResponse> {
    return (await this.apiClient.proof.proof(this.basicQuery)).unwrap();
  }

  async proofStatus(): Promise<TProofStatusDatabaseResponse> {
    return (
      await this.apiClient.proof.proofStatusDatabase(this.basicQuery)
    ).unwrap();
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

  async rollUpHistory(): Promise<TRollupHistoryResponse> {
    return (
      await this.apiClient.rollup.rollupHistory(this.basicQuery)
    ).unwrap();
  }
}
