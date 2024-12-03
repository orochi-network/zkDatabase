import { TDatabaseRequest } from './database.js';
import { TMetadataDetailCollection } from './metadata.js';
import { TSchemaFieldInput } from './schema.js';

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

export type TCollectionDetail = TMetadataDetailCollection<{
  index: TCollectionIndex[];
  sizeOnDisk: number;
}>;

export type TCollectionRequest = TDatabaseRequest & {
  collectionName: string;
};

export type TCollectionCreateRequest = TCollectionRequest & {
  schema: TSchemaFieldInput[];
  permission?: number;
  groupName?: string;
};

export type TIndexRequest = {
  indexName: string;
};

export type TIndexListRequest = TCollectionRequest;

export type TIndexCreateRequest = TIndexRequest & {
  index: TCollectionIndex[];
};

export type TIndexDetailRequest = TIndexRequest & TIndexRequest;
