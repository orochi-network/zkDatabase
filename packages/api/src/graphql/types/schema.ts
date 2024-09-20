export type TSchemaField = {
  name: string;
  kind: string;
  indexed?: boolean;
};

export type TSchema = TSchemaField[];
