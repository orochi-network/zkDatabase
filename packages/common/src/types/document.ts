import { ObjectId } from 'mongodb';
import { TSchemaField } from '../schema.js';
import { TDbRecord } from './common.js';

export type TDocumentField = TSchemaField;

export type TDocument = {
  docId: string;
  active: boolean;
  previousId: ObjectId;
  nextId: ObjectId;
};

export type TDocumentRecord = TDbRecord<TDocument>;

export type TDocumentDetail = TDocument & {
  // Index a field must be `document.fieldName.name`
  document: Record<string, TDocumentField>;
};

export type TDocumentHistory = {
  docId: string;
  docList: TDocumentDetail[];
  active: boolean;
};
