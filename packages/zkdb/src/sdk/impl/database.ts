import { JsonProof, PublicKey } from 'o1js';
import { ZKCollection } from '../interfaces/collection.js';
import { createGroup, getGroups } from '../../repository/group.js';
import { DatabaseSettings } from '../../types/database.js';
import { ZKDatabase } from '../interfaces/database.js';
import { SchemaDefinition } from '../schema.js';
import { CollectionQueryImpl } from './collection.js';
import { ZKGroupImpl } from './group.js';
import { createCollection } from '../../repository/collection.js';
import {
  changeDatabaseOwner,
  createDatabase,
  getDatabaseSettings,
} from '../../repository/database.js';
import { ZKGroup } from '../interfaces/group.js';
import { Permissions } from '../../types/permission.js';
import { GroupDescription } from '../../types/group.js';
import { getProof } from '../../repository/proof.js';

export class ZKDatabaseImpl implements ZKDatabase {
  private databaseName: string;

  constructor(databaseName: string) {
    this.databaseName = databaseName;
  }

  async getProof(): Promise<JsonProof> {
    return getProof(this.databaseName);
  }

  from(collectionName: string): ZKCollection {
    return new CollectionQueryImpl(this.databaseName, collectionName);
  }

  async createCollection<T extends { getSchema: () => SchemaDefinition }>(
    collectionName: string,
    groupName: string,
    type: T,
    permissions: Permissions
  ): Promise<void> {
    return createCollection(
      this.databaseName,
      collectionName,
      groupName,
      type.getSchema(),
      permissions
    );
  }

  async createGroup(groupName: string, description: string): Promise<void> {
    return createGroup(this.databaseName, groupName, description);
  }

  fromGroup(groupName: string): ZKGroup {
    return new ZKGroupImpl(this.databaseName, groupName);
  }

  getGroups(): Promise<GroupDescription[]> {
    return getGroups(this.databaseName);
  }

  async create(merkleHeight: number, publicKey: PublicKey): Promise<void> {
    return createDatabase(this.databaseName, merkleHeight, publicKey);
  }

  async getSettings(): Promise<DatabaseSettings> {
    return getDatabaseSettings(this.databaseName);
  }

  async changeOwner(newOwner: string): Promise<void> {
    return changeDatabaseOwner(this.databaseName, newOwner);
  }
}
