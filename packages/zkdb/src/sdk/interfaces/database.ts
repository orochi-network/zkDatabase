/* eslint-disable no-unused-vars */
import { Field, JsonProof, PrivateKey } from 'o1js';
import { DocumentEncoded, SchemaDefinition } from '../schema.js';
import { Permissions } from '../../types/permission.js';
import { ZKCollection } from './collection.js';
import { ZKGroup } from './group.js';

export interface ZKDatabase {
  collection<
    T extends {
      new (..._args: any[]): InstanceType<T>;
      deserialize: (_doc: DocumentEncoded) => any;
    },
  >(
    collectionName: string,
    schema: T
  ): Promise<ZKCollection<T>>;
  createCollection(
    collectionName: string,
    groupName: string,
    schemaDefinition: SchemaDefinition,
    permissions: Permissions
  ): Promise<void>;
  collectionExist(collectionName: string): Promise<boolean>;
  createGroup(name: string, description: string): Promise<ZKGroup>;
  listGroups(): Promise<ZKGroup[]>;
  getRoot(): Promise<Field>;
  getProof(): Promise<JsonProof>;
  rollUp(): Promise<void>;
}
