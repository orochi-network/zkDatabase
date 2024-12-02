import { OwnershipAndPermission } from '@zkdb/permission';
import { SchemaField } from '../domain/common/schema.js';
import { ProvableTypeString } from '../domain/common/schema.js';

export type TDocument = {
  docId: string;
  field: SchemaField[];
  createdAt: Date;
};

export type THistoryDocument = {
  docId: string;
  docList: TDocument[];
  active: boolean;
};

export type TDocumentSchemaField = {
  order: number;
  name: string;
  kind: ProvableTypeString;
  indexed: boolean;
};

export type TDocumentSchema = TDocumentSchemaField[];

export type TDocumentSchemaFieldInput = Omit<TDocumentSchemaField, 'order'>;

export type TDocumentSchemaInput = TDocumentSchemaFieldInput[];

export type TDocumentMetadata = OwnershipAndPermission & {
  collection: string;
  field: SchemaField[];
  createdAt: Date;
  updatedAt: Date;
};
