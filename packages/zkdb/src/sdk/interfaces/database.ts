/* eslint-disable no-unused-vars */
import { JsonProof } from 'o1js';
import { ZKCollection } from './collection';
import { DatabaseSettings, GroupDescription, Permissions } from '../../types';
import { SchemaDefinition } from '../schema';
import { ZKGroup } from './group';

export interface ZKDatabase {
  from(name: string): ZKCollection;
  // Group
  createGroup(groupName: string, description: string): Promise<boolean>;
  fromGroup(groupName: string): ZKGroup;
  getGroups(): Promise<GroupDescription[]>;
  // Settings
  getSettings(): Promise<DatabaseSettings>;
  // Collection
  getCollections(): Promise<string[]>;
  createCollection<
    T extends {
      getSchema: () => SchemaDefinition;
    },
  >(
    collectionName: string,
    groupName: string,
    type: T,
    indexes: string[],
    permissions: Permissions
  ): Promise<boolean>;
  // Ownership
  changeOwner(newOwner: string): Promise<boolean>;
  // Proof
  getProof(): Promise<JsonProof>;
}
