import { ProvableTypeString } from '../common';

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
