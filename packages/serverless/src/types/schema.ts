import { ProvableTypeString } from '../domain/common/schema.js';

export type TSchemaField = {
  order: number;
  name: string;
  kind: ProvableTypeString;
  indexed: boolean;
};

export type TSchemaFieldInput = Omit<TSchemaField, 'order'>;
