import { ProvableTypeString } from '../common/schema.js';

export type DocumentSchemaField = {
  order: number,
  name: string;
  kind: ProvableTypeString;
};
export type DocumentSchema = DocumentSchemaField[];

export type DocumentSchemaFieldInput = Omit<DocumentSchemaField, 'order'>;
export type DocumentSchemaInput = DocumentSchemaFieldInput[]

