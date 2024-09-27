import { JsonProof, PublicKey } from 'o1js';
import { IApiClient } from '@zkdb/api';
import { ZKCollection, ZKDatabase, ZKGroup } from '../interfaces';
import { DatabaseSettings, Permissions, GroupDescription } from '../../types';
import { SchemaDefinition } from '../schema';
import { CollectionQueryImpl } from './collection';
import { ZKGroupImpl } from './group';

export class ZKDatabaseImpl implements ZKDatabase {
  private databaseName: string;
  private apiClient: IApiClient;

  constructor(databaseName: string, apiClient: IApiClient) {
    this.databaseName = databaseName;
    this.apiClient = apiClient;
  }

  async getProof(): Promise<JsonProof> {
    const result = await this.apiClient.proof.get({
      databaseName: this.databaseName,
    });

    return result.unwrap();
  }

  from(collectionName: string): ZKCollection {
    return new CollectionQueryImpl(
      this.databaseName,
      collectionName,
      this.apiClient
    );
  }

  async createCollection<T extends { getSchema: () => SchemaDefinition }>(
    collectionName: string,
    groupName: string,
    type: T,
    permissions: Permissions
  ): Promise<boolean> {
    const result = await this.apiClient.collection.create({
      databaseName: this.databaseName,
      collectionName: collectionName,
      groupName,
      schema: type.getSchema(),
      permissions,
    });

    return result.unwrap();
  }

  async createGroup(groupName: string, description: string): Promise<boolean> {
    const result = await this.apiClient.group.create({
      databaseName: this.databaseName,
      groupName,
      groupDescription: description,
    });

    return result.unwrap();
  }

  fromGroup(groupName: string): ZKGroup {
    return new ZKGroupImpl(this.databaseName, groupName, this.apiClient);
  }

  async getGroups(): Promise<GroupDescription[]> {
    const result = await this.apiClient.group.list({
      databaseName: this.databaseName,
    });

    return result
      .unwrap()
      .map(({ name, description, createdAt, createdBy }) => ({
        name,
        description,
        createdAt: new Date(createdAt),
        createdBy: createdBy,
      }));
  }

  async getCollections(): Promise<string[]> {
    const result = await this.apiClient.collection.list({
      databaseName: this.databaseName,
    });

    return result.unwrap().map((collection) => collection.name);
  }

  async create(merkleHeight: number, publicKey: PublicKey): Promise<boolean> {
    const result = await this.apiClient.db.create({
      databaseName: this.databaseName,
      merkleHeight,
      publicKey: publicKey.toBase58(),
    });

    return result.unwrap();
  }

  async getSettings(): Promise<DatabaseSettings> {
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
}
