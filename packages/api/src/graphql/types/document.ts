export type DocumentEncoded = {
  name: string;
  kind: string;
  value: string;
}[];

export type DocumentPayload = {
  docId: string,
  fields: DocumentEncoded,
  createdAt: Date
}