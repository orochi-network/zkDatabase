import { IApiClient } from '@zkdb/api';
import { JsonProof } from 'o1js';
import {
  DatabaseSettings,
  GroupDescription,
  TDbTransaction,
  TGetRollUpHistory,
  TTransactionType,
} from '../../types';
import {
  ZKCollection,
  ZKDatabase,
  ZKDatabaseConfig,
  ZKGroup,
} from '../interfaces';
import { CollectionImpl } from './collection';
import { ZKGroupImpl } from './group';
import { ZkDbTransaction } from '../transaction/zkdb-transaction';
import { Signer } from '../signer';

// TODO: Implement transactions endpoints
export class ZKDatabaseImpl implements ZKDatabase {
  private databaseName: string;
  private apiClient: IApiClient;
  private signer: Signer;

  constructor(databaseName: string, apiClient: IApiClient, signer: Signer) {
    this.databaseName = databaseName;
    this.apiClient = apiClient;
    this.signer = signer;
  }

  async create(config: ZKDatabaseConfig): Promise<ZkDbTransaction> {
    const result = await this.apiClient.db.create({
      databaseName: this.databaseName,
      merkleHeight: config.merkleHeight,
    });

    const dbTransaction = result.unwrap();

    return new ZkDbTransaction(dbTransaction, this.apiClient, this.signer);
  }

  async exist(): Promise<boolean> {
    const result = await this.apiClient.db.exist({
      databaseName: this.databaseName,
    });

    return result.unwrap();
  }

  async getProof(): Promise<JsonProof> {
    const result = await this.apiClient.proof.get({
      databaseName: this.databaseName,
    });

    return result.unwrap();
  }

  collection(collectionName: string): ZKCollection {
    return new CollectionImpl(
      this.databaseName,
      collectionName,
      this.apiClient
    );
  }

  group(groupName: string): ZKGroup {
    return new ZKGroupImpl(this.databaseName, groupName, this.apiClient);
  }

  async listGroup(): Promise<GroupDescription[]> {
    const result = await this.apiClient.group.list({
      databaseName: this.databaseName,
    });

    return result
      .unwrap()
      .map(({ groupName, description, createdAt, createBy }) => ({
        groupName,
        description,
        createdAt: new Date(createdAt),
        createBy,
      }));
  }

  async listCollection(): Promise<string[]> {
    const result = await this.apiClient.collection.list({
      databaseName: this.databaseName,
    });

    return result.unwrap().map((collection) => collection.name);
  }

  async setting(): Promise<DatabaseSettings> {
    const result = await this.apiClient.db.setting({
      databaseName: this.databaseName,
    });
    return result.unwrap();
  }

  async changeOwner(newOwner: string): Promise<boolean> {
    const result = await this.apiClient.db.transferOwnership({
      databaseName: this.databaseName,
      newOwner,
    });

    return result.unwrap();
  }

  async getTransaction(
    transactionType: TTransactionType
  ): Promise<ZkDbTransaction> {
    const result = await this.apiClient.transaction.getTransaction({
      databaseName: this.databaseName,
      transactionType,
    });
    const dbTransaction = result.unwrap();

    return new ZkDbTransaction(dbTransaction, this.apiClient, this.signer);
  }

  async createRollup(): Promise<ZkDbTransaction> {
    const result = await this.apiClient.rollup.createRollUp({
      databaseName: this.databaseName,
    });
    
    const dbTransaction = result.unwrap();

    return new ZkDbTransaction(dbTransaction, this.apiClient, this.signer);
  }

  async getRollUpHistory(): Promise<TGetRollUpHistory> {
    const result = await this.apiClient.rollup.getRollUpHistory({
      databaseName: this.databaseName,
    });
    return result.unwrap();
  }
}
