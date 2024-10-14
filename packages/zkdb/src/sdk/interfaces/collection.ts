/* eslint-disable no-unused-vars */
import { IndexField } from 'src/types/collection-index';
import { Filter, MerkleWitness, Pagination, Permissions } from '../../types';
import { ZKDocument } from '../interfaces';
import { DocumentEncoded } from '../schema.js';
import { Ownable } from './ownable.js';

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
  createIndexes(indexes: IndexField[]): Promise<boolean>;
  dropIndex(indexName: string): Promise<boolean>;
}
