import { ProvableTypeString } from '../common/schema.js';

export type DocumentSchemaField = {
  name: string;
  kind: ProvableTypeString;
  indexed: boolean;
};

export type DocumentSchema = DocumentSchemaField[];
