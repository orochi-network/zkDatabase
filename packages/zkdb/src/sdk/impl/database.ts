import { JsonProof, PublicKey } from 'o1js';
import { ZKCollection } from '../interfaces/collection.js';
import { DatabaseSettings } from '../../types/database.js';
import { ZKDatabase } from '../interfaces/database.js';
import { SchemaDefinition } from '../schema.js';
import { CollectionQueryImpl } from './collection.js';
import { ZKGroupImpl } from './group.js';
import { ZKGroup } from '../interfaces/group.js';
import { Permissions } from '../../types/permission.js';
import { GroupDescription } from '../../types/group.js';
import { IApiClient } from '@zkdb/api';

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

    const groups = result.unwrap();

    return groups.map((group) => ({
      name: group.name,
      description: group.description,
      createdAt: new Date(group.createdAt),
      createdBy: group.createdBy,
    }));
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
