import { OwnershipAndPermission } from '@zkdb/permission';
import type { IndexDirection } from 'mongodb';
import { TSchemaSerializedFieldDefinition } from '../schema.js';
import { TPickAlter } from './common.js';
import { TDatabaseRequest } from './database.js';
import { TCollectionMetadata } from './metadata.js';

/**
 * Sorting type
 * @enum
 * @property {string} Asc - Ascending -1
 * @property {string} Desc - Descending 1
 */
export enum EIndexType {
  Asc = 'Asc',
  Desc = 'Desc',
}

/**
 * Property type
 * The value must compatible with MongoDB
 * This enum is for response type/showing data, not for input
 * @enum
 * @readonly
 * @property {string} Compound - Compound index
 * @property {string} Single - Single index
 */
export enum EIndexProperty {
  // Pascal case to consist with Graphql Enum type
  Compound = 'Compound',
  Single = 'Single',
}

export type TCollectionIndex = {
  index: Record<string, EIndexType>;
  unique: boolean;
};

/** Mapping type of index on server side */
export type TCollectionIndexMap<T = any> = {
  [Property in keyof T as `document.${string & Property}.value`]?: IndexDirection;
};

// It's base type of collection, it isn't how it will be store in mongodb
export type TCollection = {
  collectionName: string;
  schema: TSchemaSerializedFieldDefinition[];
};

// Collection index info in MongoDB
export type TCollectionIndexInfoMongo = {
  name: string;
  size: number;
  access: number;
  since: Date;
  property: EIndexProperty;
};

// Mapped collection index info
export type TCollectionIndexInfo = Pick<
  TCollectionIndexInfoMongo,
  'access' | 'property' | 'size'
> &
  TPickAlter<
    TCollectionIndexInfoMongo,
    {
      name: 'indexName';
      since: 'createdAt';
    }
  > &
  TCollectionIndex;

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
  Partial<
    TPickAlter<
      OwnershipAndPermission,
      {
        group: 'groupName';
        permission: 'permission';
      }
    >
  >;

export type TCollectionCreateResponse = boolean;

// Collection list
export type TCollectionListRequest = TDatabaseRequest;

export type TCollectionListResponse = TCollectionMetadata[];

// Collection exist
export type TCollectionExistRequest = TCollectionRequest;

export type TCollectionExistResponse = boolean;

// Index
export type TIndexRequest = TCollectionRequest &
  Pick<TCollectionIndexInfo, 'indexName'>;

// Index list
export type TIndexListRequest = TCollectionRequest;

export type TIndexListResponse = TCollectionIndexInfo[];

// Index create
export type TIndexCreateRequest = TCollectionRequest & {
  index: TCollectionIndex[];
};

export type TIndexCreateResponse = boolean;

// Index exist
export type TIndexExistRequest = Omit<TIndexCreateRequest, 'index'>;

export type TIndexExistResponse = boolean;

// Index drop
export type TIndexDropRequest = TCollectionRequest & {
  indexName: string;
};

export type TIndexDropResponse = boolean;
