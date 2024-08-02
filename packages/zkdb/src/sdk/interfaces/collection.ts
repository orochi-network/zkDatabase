/* eslint-disable no-unused-vars */
import { MerkleWitness } from '../../types/merkle-tree.js';
import { DocumentEncoded } from '../schema.js';
import { Permissions } from '../../types/permission.js';

export type Filter<T extends new (..._args: any) => any> = Partial<
  InstanceType<T>
>;

export interface ZKCollection<
  T extends {
    new (..._args: any): InstanceType<T>;
    deserialize: (_doc: DocumentEncoded) => any;
  },
> {
  listIndexes(): Promise<string[]>;
  dropIndex(indexName: string): Promise<boolean>;
  createIndex(indexName: string): Promise<boolean>;
  createIndexes(indexNames: string[]): Promise<boolean>;
  changePermissions(): Promise<boolean>;
  findOne(filter: Filter<T>): Promise<InstanceType<T> | null>;
  deleteOne(filter: Filter<T>): Promise<MerkleWitness>;
  insertOne(model: InstanceType<T>): Promise<MerkleWitness>;
  insertOneWithPermissions(
    model: InstanceType<T>,
    permissions: Permissions
  ): Promise<MerkleWitness>;
  updateOne(filter: Filter<T>, model: InstanceType<T>): Promise<MerkleWitness>;
  changeOwner(groupName: string): Promise<void>;
  changeGroup(userName: string): Promise<void>;
}
