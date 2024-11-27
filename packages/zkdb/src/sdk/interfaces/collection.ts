/* eslint-disable no-unused-vars */
import { IndexField } from 'src/types/collection-index';
import { Filter, MerkleWitness, Pagination, Permissions } from '../../types';
import { ZKDocument } from '../interfaces';
import { DocumentEncoded, SchemaDefinition } from '../schema';
import { Ownable } from './ownable';

export interface ZKCollectionIndex {
  list(): Promise<string[]>;
  create(indexes: IndexField[]): Promise<boolean>;
  drop(indexName: string): Promise<boolean>;
}

export interface ZKCollection {
  get ownership(): Ownable;

  get index(): ZKCollectionIndex;

  exist(): Promise<boolean>;

  create<
    T extends {
      getSchema: () => SchemaDefinition;
    },
  >(
    groupName: string,
    type: T,
    indexes: IndexField[],
    permissions: Permissions
  ): Promise<boolean>;

  findOne<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<ZKDocument | null>;

  findMany<
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

  drop<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<MerkleWitness>;
}
