/* eslint-disable no-unused-vars */
import { ZKCollection } from './collection.js';
import { DatabaseSettings } from '../../types/database.js';
import { GroupDescription } from '../../types/group.js';
import { SchemaDefinition } from '../schema.js';
import { Permissions } from '../../types/permission.js';
import { ZKGroup } from './group.js';
import { JsonProof } from 'o1js';

export interface ZKDatabase {
  from(name: string): ZKCollection;

  createCollection<
    T extends {
      getSchema: () => SchemaDefinition;
    },
  >(
    collectionName: string,
    groupName: string,
    type: T,
    permissions: Permissions
  ): Promise<boolean>;
  
  createGroup(groupName: string, description: string): Promise<boolean>;

  fromGroup(groupName: string): ZKGroup;

  getGroups(): Promise<GroupDescription[]>;
  getSettings(): Promise<DatabaseSettings>;
  
  changeOwner(newOwner: string): Promise<boolean>

  getProof(): Promise<JsonProof>
}
