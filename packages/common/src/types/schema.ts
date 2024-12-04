import { TContractSchemaField, TContractSchemaFieldDefinition } from '../schema.js';
import { ESorting } from './collection.js';


export type TSchemaFieldDefinition = TContractSchemaFieldDefinition & {
  order: number;
  index: boolean;
  sorting: ESorting;
};


