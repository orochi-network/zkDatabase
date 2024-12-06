import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
import { TDbRecord } from './common.js';

export type TDocumentField = TContractSchemaField;

export type TDocument = {
  docId: string;
  active: boolean;
  previousObjectId: ObjectId;
  document: Record<string, TDocumentField>;
};

// Document history can return TDocumentRecord[]
export type TDocumentRecord = TDbRecord<TDocument>;
