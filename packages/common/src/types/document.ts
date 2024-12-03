import { ObjectId } from 'mongodb';
import { TSchemaField } from '../schema.js';

export type TDocumentField = TSchemaField;

export type TDocumentBasic = {
  _id: ObjectId;
  docId: string;
  active: boolean;
  previousId: ObjectId;
  nextId: ObjectId;
  updatedAt: Date;
  createdAt: Date;
};

export type TDocumentDetail = TDocumentBasic & {
  document: Record<string, TDocumentField>;
};

export type TDocumentHistory = {
  docId: string;
  docList: TDocumentDetail[];
  active: boolean;
};
