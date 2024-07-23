import { ProvableTypeString } from '../../domain/common/schema.js';

export type SchemaFieldData = {
  name: string;
  kind: ProvableTypeString;
  indexed: boolean;
};

export type SchemaData = SchemaFieldData[];
