import { OwnershipAndPermission } from '@zkdb/permission';
import { IndexDirection } from 'mongodb';
import { TDbRecord, TPickAlter } from './common.js';
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
 * The value must compatible with MongoDB
 * @enum
 * @readonly
 * @property {string} Compound - Compound index
 * @property {string} Unique - Unique index
 */
export enum EProperty {
  Compound = 'compound',
  Unique = 'unique',
}

export type TCollectionIndex<T = Record<string, any>> = Partial<
  Record<keyof T, ESorting>
>;

/** Mapping type of index on server side */
export type TCollectionIndexMap<T = any> = {
  [Property in keyof T as `document.${string & Property}.value`]?: IndexDirection;
};

export type TCollection = {
  collectionName: string;
  schema: TSchemaFieldDefinition[];
};

export type TCollectionRecord = TDbRecord<TCollection>;

// Collection index info in MongoDB
export type TCollectionIndexInfoMongo = {
  name: string;
  size: number;
  access: number;
  since: Date;
  property: EProperty;
};

// Mapped collection index info
export type TCollectionIndexInfo = TPickAlter<
  TCollectionIndexInfoMongo,
  {
    name: 'indexName';
    since: 'createdAt';
  }
>;

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

// Collection list
export type TCollectionListRequest = TDatabaseRequest;

export type TCollectionListResponse = TMetadataCollection[];

// Collection exist
export type TCollectionExistRequest = TCollectionRequest;

// Index
export type TIndexRequest = TCollectionRequest &
  Pick<TCollectionIndexInfo, 'indexName'>;

// Index list
export type TIndexListRequest = TCollectionRequest;

export type TIndexListResponse = TCollectionIndexInfo[];

// Index create
export type TIndexCreateRequest = TIndexRequest &
  TCollectionRequest & {
    index: TCollectionIndex;
  };

// Index exist
export type TIndexExistRequest = TIndexCreateRequest;

// Index drop
export type TIndexDropRequest = TIndexCreateRequest;

// Index detail
export type TIndexDetailRequest = TIndexRequest;
