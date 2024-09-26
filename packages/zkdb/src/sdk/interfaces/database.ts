/* eslint-disable no-unused-vars */
import { JsonProof } from 'o1js';
import { ZKCollection } from './collection';
import { DatabaseSettings, GroupDescription, Permissions } from '../../types';
import { SchemaDefinition } from '../schema';
import { ZKGroup } from './group';

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

  changeOwner(newOwner: string): Promise<boolean>;

  getProof(): Promise<JsonProof>;
}
