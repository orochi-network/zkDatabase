export type SchemaField = {
  name: string;
  kind: string;
  indexed?: boolean;
};

export type Schema = SchemaField[]