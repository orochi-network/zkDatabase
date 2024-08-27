/* eslint-disable no-unused-vars */
import { MerkleWitness } from '../../types/merkle-tree.js';
import { ZKDocument } from '../interfaces/document.js';
import { QueryOptions } from '../query/query-builder.js';
import { Filter } from '../../types/filter.js';
import { DocumentEncoded } from '../schema.js';
import { Ownable } from './ownable.js';

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


  getDocumentHistory(documentId: string): Promise<ZKDocument[]>
}
