import { IApiClient } from '@zkdb/api';
import {
  ETransactionType,
  TGroupRecord,
  TProofStatusDatabaseResponse,
  TRollUpHistoryResponse,
  TSchemaExtendable,
  TTransactionDraftResponse,
  TUser,
  TUserRecord,
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

// TODO: Implement transactions endpoints
export class ZKDatabaseImpl implements IDatabase {
  private databaseName: string;
  private apiClient: IApiClient;

  async create(config: TDatabaseConfig): Promise<boolean> {
    return (
      await this.apiClient.db.dbCreate({
        databaseName: this.databaseName,
        merkleHeight: config.merkleHeight,
      })
    ).unwrap();
  }

  async exist(): Promise<boolean> {
    return (
      await this.apiClient.db.dbExist({ databaseName: this.databaseName })
    ).unwrap();
  }

  collection<T extends TSchemaExtendable<any>>(
    collectionName: string
  ): ICollection<T> {
    return new Collection(this.apiClient, this.databaseName, collectionName);
  }

  async collectionList(): Promise<string[]> {
    return (
      await this.apiClient.collection.collectionList({
        databaseName: this.databaseName,
      })
    )
      .unwrap()
      .map((e) => e.collectionName);
  }

  group(groupName: string): IGroup {
    throw new Error('Method not implemented.');
  }
  groupList(): Promise<TGroupRecord[]> {
    throw new Error('Method not implemented.');
  }
  user(
    userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>
  ): IUser {
    throw new Error('Method not implemented.');
  }
  userList(): Promise<TUserRecord[]> {
    throw new Error('Method not implemented.');
  }
  proofZk(): Promise<TZkProofResponse> {
    throw new Error('Method not implemented.');
  }
  proofStatus(): Promise<TProofStatusDatabaseResponse> {
    throw new Error('Method not implemented.');
  }
  transactionDraft(
    transactionType: ETransactionType
  ): Promise<TTransactionDraftResponse> {
    throw new Error('Method not implemented.');
  }
  transactionSubmit(id: string, txHash: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  rollUpStart(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  rollUpHistory(): Promise<TRollUpHistoryResponse> {
    throw new Error('Method not implemented.');
  }
}
