import { TDbRecord } from './common.js';
import { TDatabaseRequest } from './database.js';
import { TMetadataDetailCollection } from './metadata.js';

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

/**
 * Collection type
 * @enum
 * @property {string} collectionName - Collection name
 * @property {TCollectionIndex[]} index - Indexes
 * @property {number} sizeOnDisk - Size on disk
 */
export type TCollection = {
  collectionName: string;
  index: TCollectionIndex[];
  sizeOnDisk: number;
};

export type TCollectionRecord = TDbRecord<TCollection>;

/**
 * Collection index type
 * @enum
 * @property {string} name - Index name
 * @property {ESorting} sorting - Sorting
 */
export type TCollectionIndex = {
  name: string;
  sorting: ESorting;
};

export type TCollectionIndexInfo = {
  name: string;
  size: number;
  access: number;
  since: Date;
  property: EProperty;
};

export type TCollectionDetail = TMetadataDetailCollection<TCollection>;

export type TCollectionRequest = TDatabaseRequest &
  Pick<TCollection, 'collectionName'>;

export type TCollectionCreateRequest = TCollectionRequest & {
  schema: TSchemaFieldInput[];
  permission: number;
  groupName: string;
};

export type TIndexRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;

export type TIndexCreateRequest = TIndexRequest & Pick<TCollection, 'index'>;

export type TIndexDetailRequest = TIndexRequest;
