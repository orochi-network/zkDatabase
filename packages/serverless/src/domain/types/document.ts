import { ProvableTypeString } from '../common/schema.js';

export type DocumentFields = Array<{
  name: string;
  kind: ProvableTypeString;
  value: string;
}>;

export type Document = {
  docId: string;
  fields: DocumentFields;
  createdAt: Date;
};
