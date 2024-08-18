import { PublicKey } from 'o1js';
import { ZKCollection } from '../interfaces/collection.js';
import { createGroup, getGroups } from '../../repository/group.js';
import { DatabaseSettings } from '../../types/database.js';
import { ZKDatabase } from '../interfaces/database.js';
import { SchemaDefinition } from '../schema.js';
import { CollectionQueryImpl } from './collection.js';
import { ZKGroupImpl } from './group.js';
import { createCollection } from '../../repository/collection.js';
import { createDatabase, getDatabaseSettings } from '../../repository/database.js';
import { ZKGroup } from '../interfaces/group.js';
import { Permissions } from '../../types/permission.js';
import { GroupDescription } from '../../types/group.js';

export class ZKDatabaseImpl implements ZKDatabase {
  private databaseName: string;

  constructor(databaseName: string) {
    this.databaseName = databaseName;
  }
  newCollection<T extends { getSchema: () => SchemaDefinition }>(
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

  async newGroup(groupName: string, description: string): Promise<void> {
    return createGroup(this.databaseName, groupName, description);
  }

  groups(): Promise<GroupDescription[]> {
    return getGroups(this.databaseName);
  }

  collection(collectionName: string): ZKCollection {
    return new CollectionQueryImpl(this.databaseName, collectionName);
  }

  group(groupName: string): ZKGroup {
    return new ZKGroupImpl(this.databaseName, groupName);
  }

  async create(merkleHeight: number, publicKey: PublicKey): Promise<void> {
    return createDatabase(this.databaseName, merkleHeight, publicKey);
  }

  async getSettings(): Promise<DatabaseSettings> {
    return getDatabaseSettings(this.databaseName);
  }
}
