/* eslint-disable no-unused-vars */
import { PublicKey } from 'o1js';
import { ZKCollection } from './collection.js';
import { GroupQuery } from './group.js';
import { DatabaseSettings } from '../../../types/database.js';
import { GroupDescription } from '../../../sdk/types/group.js';
import { DocumentEncoded, SchemaDefinition } from '../../../sdk/schema.js';
import { Permissions } from '../../../types/permission.js';

export interface ZKDatabase {
  collection(name: string): ZKCollection;

  newCollection<
    T extends {
      getSchema: () => SchemaDefinition;
    },
  >(
    collectionName: string,
    groupName: string,
    type: T,
    permissions: Permissions
  ): Promise<void>;
  newGroup(groupName: string, description: string): Promise<void>;

  group(groupName: string): GroupQuery;

  groups(): Promise<GroupDescription[]>;
  getSettings(): Promise<DatabaseSettings>;
}
