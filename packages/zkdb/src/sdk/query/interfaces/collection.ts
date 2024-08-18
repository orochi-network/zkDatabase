/* eslint-disable no-unused-vars */
import { ZKDocument } from '../../../sdk/interfaces/document.js';
import { QueryOptions } from '../builder/query-builder.js';
import { Ownable } from './ownable.js';
import { Permissions } from '../../..//types/permission.js';
import { DocumentEncoded } from '../../../sdk/schema.js';
import { MerkleWitness } from '../../../types/merkle-tree.js';
import { Filter } from '../../../sdk/types/filter.js';

export interface ZKCollection extends Ownable {
  findOne<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<ZKDocument | null>;
  queryDocuments<T>(queryOptions: QueryOptions<T>): Promise<ZKDocument[]>;
  insertOne<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    model: InstanceType<T>,
    permissions: Permissions
  ): Promise<MerkleWitness>;
  insertOne<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    model: InstanceType<T>
  ): Promise<MerkleWitness>;
  updateOne<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    filter: Filter<T>,
    model: InstanceType<T>
  ): Promise<MerkleWitness>;
  deleteOne<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<MerkleWitness>;
}
