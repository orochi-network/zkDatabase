import { ObjectId } from 'mongodb';
import { SchemaField } from '../domain/common/schema.js';

export type TDocumentField = SchemaField;

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
