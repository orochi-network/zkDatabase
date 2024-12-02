import { OwnershipAndPermission } from '@zkdb/permission';
import { TSchemaField } from './schema.js';

export enum ESorting {
  Asc,
  Desc,
}

export enum EProperty {
  Compound,
  Unique,
}

export type TCollection = {
  name: string;
  index: string[];
  schema: TSchemaField[];
  ownership: OwnershipAndPermission;
  sizeOnDisk: number;
};

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
