/* eslint-disable no-unused-vars */
import { MerkleWitness } from '../../types/merkle-tree.js';
import { ZKDocument } from '../interfaces/document.js';
import { QueryOptions } from '../query/query-builder.js';
import { Filter } from '../../types/filter.js';
import { DocumentEncoded } from '../schema.js';
import { Ownable } from './ownable.js';

export interface ZKCollection extends Ownable {
  getDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<ZKDocument | null>;

  getAvailableDocuments<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<ZKDocument[]>;

  saveDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    model: InstanceType<T>,
    permissions: Permissions
  ): Promise<MerkleWitness>;

  saveDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    model: InstanceType<T>
  ): Promise<MerkleWitness>;

  updateDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
      serialize: () => DocumentEncoded;
    },
  >(
    filter: Filter<T>,
    model: InstanceType<T>
  ): Promise<MerkleWitness>;

  deleteDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
    },
  >(
    filter: Filter<T>
  ): Promise<MerkleWitness>;

  getDocumentHistory(documentId: string): Promise<ZKDocument[]>;
}
