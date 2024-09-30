import { ProvableTypeString } from '@domain';

export type SchemaFieldData = {
  name: string;
  kind: ProvableTypeString;
  indexed: boolean;
};

export type SchemaData = SchemaFieldData[];
