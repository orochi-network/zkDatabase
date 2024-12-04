import { OwnershipAndPermission } from '@zkdb/permission';
import { TDbRecord } from './common.js';
import { TDatabaseRequest } from './database.js';
import { TMetadataDetailCollection } from './metadata.js';
import { TSchemaFieldDefinition } from './schema.js';

export enum ESorting {
  // -1
  Asc,
  // 1
  Desc,
}

export enum EProperty {
  Compound,
  Unique,
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
