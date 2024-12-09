import { OwnershipAndPermission } from '@zkdb/permission';
import { IndexDirection } from 'mongodb';
import { TDbRecord } from './common.js';
import { TDatabaseRequest } from './database.js';
import { TMetadataCollection } from './metadata.js';
import { TSchemaFieldDefinition } from './schema.js';

/**
 * Sorting type
 * @enum
 * @property {string} Asc - Ascending -1
 * @property {string} Desc - Descending 1
 */
export enum ESorting {
  Asc = 'Asc',
  Desc = 'Desc',
}

/**
 * Property type
 * @enum
 * @readonly
 * @property {string} Compound - Compound index
 * @property {string} Unique - Unique index
 */
export enum EProperty {
  Compound = 'Compound',
  Unique = 'Unique',
}

export type TCollectionIndex<T = Record<string, any>> = Partial<
  Record<keyof T, ESorting>
>;

export type TCollectionIndexSpecification<T = Record<string, any>> = Partial<
  Record<keyof T, IndexDirection>
>;

/** Mapping type of index on server side */
export type TCollectionIndexMap<T> = {
  [Property in keyof T as `document.${string & Property}.name`]?: IndexDirection;
};

export type TCollection = {
  collectionName: string;
  schema: TSchemaFieldDefinition[];
};

export type TCollectionRecord = TDbRecord<TCollection>;

export type TCollectionIndexInfo = {
  name: string;
  size: number;
  access: number;
  since: Date;
  property: EProperty;
};

export type TCollectionRequest = TDatabaseRequest &
  Pick<TCollection, 'collectionName'>;

/**
 * Collection create request
 * @typedef TCollectionCreateRequest
 * @param {collectionName} collectionName - Collection name
 * @param {TSchemaDefinition[]} schema - Collection schema
 * @param {number} permission - Collection permission
 * @param {string} group - Collection permission
 */
export type TCollectionCreateRequest = TCollectionRequest &
  Pick<TCollection, 'schema'> &
  Omit<OwnershipAndPermission, 'owner'>;

export type TCollectionListRequest = { databaseName: string };
export type TCollectionListResponse = TMetadataCollection[];

export type TIndexRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;
export type TIndexListResponse = TCollectionIndexInfo[];

export type TIndexCreateRequest = TIndexRequest &
  TCollectionRequest & {
    index: TCollectionIndex;
  };

export type TIndexExistRequest = TIndexCreateRequest;
export type TIndexDropRequest = TIndexCreateRequest;

export type TIndexDetailRequest = TIndexRequest;
