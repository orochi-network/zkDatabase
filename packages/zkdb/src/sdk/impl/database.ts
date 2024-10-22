import { JsonProof, PublicKey } from 'o1js';
import { IApiClient } from '@zkdb/api';
import { ZKCollection, ZKDatabase, ZKGroup } from '../interfaces';
import { DatabaseSettings, Permissions, GroupDescription } from '../../types';
import { SchemaDefinition } from '../schema';
import { CollectionQueryImpl } from './collection';
import { ZKGroupImpl } from './group';
import { NetworkId } from '../../types/network';

export class ZKDatabaseImpl implements ZKDatabase {
  private databaseName: string;
  private apiClient: IApiClient;
  private networkId: NetworkId;

  constructor(databaseName: string, apiClient: IApiClient, networkId: NetworkId) {
    this.databaseName = databaseName;
    this.apiClient = apiClient;
    this.networkId = networkId;
  }

  async getProof(): Promise<JsonProof> {
    const result = await this.apiClient.proof.get({
      databaseName: this.databaseName,
      networkId: this.networkId
    });

    return result.unwrap();
  }

  from(collectionName: string): ZKCollection {
    return new CollectionQueryImpl(
      this.databaseName,
      collectionName,
      this.apiClient,
      this.networkId
    );
  }

  async createCollection<T extends { getSchema: () => SchemaDefinition }>(
    collectionName: string,
    groupName: string,
    type: T,
    indexes: string[],
    permissions: Permissions
  ): Promise<boolean> {
    const result = await this.apiClient.collection.create({
      networkId: this.networkId,
      databaseName: this.databaseName,
      collectionName: collectionName,
      groupName,
      schema: type.getSchema(),
      indexes,
      permissions,
    });

    return result.unwrap();
  }

  async createGroup(groupName: string, description: string): Promise<boolean> {
    const result = await this.apiClient.group.create({
      networkId: this.networkId,
      databaseName: this.databaseName,
      groupName,
      groupDescription: description,
    });

    return result.unwrap();
  }

  fromGroup(groupName: string): ZKGroup {
    return new ZKGroupImpl(this.databaseName, groupName, this.apiClient, this.networkId);
  }

  async getGroups(): Promise<GroupDescription[]> {
    const result = await this.apiClient.group.list({
      networkId: this.networkId,
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

  async getCollections(): Promise<string[]> {
    const result = await this.apiClient.collection.list({
      networkId: this.networkId,
      databaseName: this.databaseName,
    });

    return result.unwrap().map((collection) => collection.name);
  }

  async getSettings(): Promise<DatabaseSettings> {
    const result = await this.apiClient.db.setting({
      networkId: this.networkId,
      databaseName: this.databaseName,
    });
    return result.unwrap();
  }

  async changeOwner(newOwner: string): Promise<boolean> {
    const result = await this.apiClient.db.transferOwnership({
      networkId: this.networkId,
      databaseName: this.databaseName,
      newOwner,
    });

    return result.unwrap();
  }
}
