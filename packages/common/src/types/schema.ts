import { TSchemaSerializedFieldDefinition } from '../schema.js';
import { ESorting } from './collection.js';

export type TSchemaFieldDefinition = TSchemaSerializedFieldDefinition & {
  order: number;
  index: boolean;
  sorting: ESorting;
};
