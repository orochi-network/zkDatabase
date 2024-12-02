import { OwnershipAndPermission } from '@zkdb/permission';
import { TDocumentSchema } from './document.js';

export type TSorting = 'ASC' | 'DESC';

export type TCollection = {
  name: string;
  index: string[];
  schema: TDocumentSchema;
  ownership: OwnershipAndPermission;
  sizeOnDisk: number;
};

export type TCollectionIndex = {
  name: string;
  sorting: TSorting;
};

export type TCollectionIndexInfo = {
  name: string;
  size: number;
  access: number;
  since: Date;
  property: 'compound' | 'unique';
};
