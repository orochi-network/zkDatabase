/* eslint-disable no-unused-vars */
import { MerkleWitness } from '../../types/merkle-tree.js';
import { ZKDocument } from '../interfaces/document.js';
import { QueryOptions } from '../query/query-builder.js';
import { Filter } from '../../types/filter.js';
import { DocumentEncoded } from '../schema.js';
import { Ownable } from './ownable.js';
import { Pagination } from '../../types/pagination.js';
import { Permissions } from '../../types/permission.js';

export interface ZKCollection extends Ownable {
  fetchOne<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<ZKDocument | null>;

  fetchMany<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter?: Filter<T>,
    pagination?: Pagination
  ): Promise<ZKDocument[]>;

  insert<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    model: InstanceType<T>,
    permissions: Permissions
  ): Promise<MerkleWitness>;

  insert<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    model: InstanceType<T>
  ): Promise<MerkleWitness>;

  update<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    filter: Filter<T>,
    model: InstanceType<T>
  ): Promise<MerkleWitness>;

  delete<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<MerkleWitness>;

  listIndexes(): Promise<string[]>;
  createIndexes(indexes: string[]): Promise<boolean>
  dropIndex(indexName: string): Promise<boolean>
}
