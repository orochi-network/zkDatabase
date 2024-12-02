import { OwnershipAndPermission } from '@zkdb/permission';
import { SchemaField } from '../domain/common/schema.js';
import { TSchemaField } from './schema.js';

export type TDocumentField = SchemaField;

export type TDocument = {
  docId: string;
  field: TDocumentField[];
  createdAt: Date;
};

export type THistoryDocument = {
  docId: string;
  docList: TDocument[];
  active: boolean;
};

export type TDocumentMetadata = OwnershipAndPermission & {
  collection: string;
  field: TSchemaField[];
  createdAt: Date;
  updatedAt: Date;
};
