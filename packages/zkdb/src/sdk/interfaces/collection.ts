import {
  TCollectionIndex,
  TCollectionMetadata,
  TDocumentCreateResponse,
  TPagination,
  TPaginationReturn,
  TSchemaExtendable,
} from '@zkdb/common';
import { Permission } from '@zkdb/permission';
import { IDocument } from '.';
import { IMetadata } from './metadata';

/**
 * Interface for managing collection indexes.
 * @interface ICollectionIndex
 */
export interface ICollectionIndex {
  /**
   * Retrieves all indexes in the collection.
   * @returns {Promise<TCollectionIndex[]>} A promise that resolves to an array of index objects.
   */
  list(): Promise<TCollectionIndex[]>;

  /**
   * Creates new indexes in the collection.
   * @param index
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating success or failure.
   */
  create(index: TCollectionIndex[]): Promise<boolean>;

  /**
   * Drops an existing index in the collection.
   * @param indexName
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating success or failure.
   */
  drop(indexName: string): Promise<boolean>;
}

export interface ICollection<T extends TSchemaExtendable<any>> {
  get index(): ICollectionIndex;

  get metadata(): IMetadata<TCollectionMetadata>;

  exist(): Promise<boolean>;

  create(
    schema: T,
    permission?: Permission,
    groupName?: string
  ): Promise<boolean>;

  findOne(filter: Partial<T['innerStructure']>): Promise<IDocument<T> | null>;

  findMany(
    filter?: Partial<T['innerStructure']>,
    pagination?: TPagination
  ): Promise<TPaginationReturn<IDocument<T>[]>>;

  insert(
    document: T['innerStructure'],
    permission?: Permission
  ): Promise<TDocumentCreateResponse>;
}
