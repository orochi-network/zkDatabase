export type TSchemaFieldPayload = {
  order: number,
  name: string;
  kind: string;
  indexed?: boolean;
};
export type TSchemaPayload = TSchemaFieldPayload[];

export type TSchemaField = Omit<TSchemaFieldPayload, "order">
export type TSchema = TSchemaField[];
