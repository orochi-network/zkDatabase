/* eslint-disable no-unused-vars */
import { ZKCollection } from './collection.js';
import { DatabaseSettings } from '../../types/database.js';
import { GroupDescription } from '../../types/group.js';
import { SchemaDefinition } from '../schema.js';
import { Permissions } from '../../types/permission.js';
import { ZKGroup } from './group.js';

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

  group(groupName: string): ZKGroup;

  groups(): Promise<GroupDescription[]>;
  getSettings(): Promise<DatabaseSettings>;

  changeOwner(newOwner: string): Promise<void>
}
