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

export type TCollection = {
  collectionName: string;
  index: TCollectionIndex[];
  sizeOnDisk: number;
};

export type TCollectionRecord = TDbRecord<TCollection>;

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
