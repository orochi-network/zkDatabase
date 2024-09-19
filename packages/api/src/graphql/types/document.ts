export type TDocumentEncoded = {
  name: string;
  kind: string;
  value: string;
}[];

export type TDocumentPayload = {
  docId: string;
  fields: TDocumentEncoded;
  createdAt: Date;
};
