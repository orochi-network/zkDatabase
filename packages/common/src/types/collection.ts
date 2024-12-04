import { OwnershipAndPermission } from '@zkdb/permission';
import { TDbRecord } from './common.js';
import { TDatabaseRequest } from './database.js';
import { TMetadataDetailCollection } from './metadata.js';
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

/** Mapping type of index on server side */
export type TCollectionIndexMap<T> = {
  [Property in keyof T as `document.${string & Property}.name`]?: ESorting;
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

// Do we actually need this?
export type TCollectionAndMetadata = TMetadataDetailCollection<TCollection>;
const x: TCollectionAndMetadata = {
  metadata: {
    permission,
    schema: '',
    sizeOnDisk: '1',
  },
  collectionName: '',
  schema: {} as any,
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

export type TIndexRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;

export type TIndexCreateRequest = TIndexRequest & {
  index: TCollectionIndex;
};

export type TIndexDetailRequest = TIndexRequest;
