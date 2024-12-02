import { ProvableTypeString } from '../domain/common/schema.js';
import { ESorting } from './collection.js';

export type TSchemaField = {
  order: number;
  name: string;
  kind: ProvableTypeString;
  indexed: boolean;
};

export type TSchemaFieldInput = Omit<TSchemaField, 'order'> & {
  sorting?: ESorting;
};
