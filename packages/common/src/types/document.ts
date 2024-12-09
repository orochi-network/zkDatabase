import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
import { TDbRecord } from './common.js';
import { TMetadataDocument } from './metadata.js';

export type TDocumentField = TContractSchemaField;

export type TDocument = {
  docId: string;
  active: boolean;
  previousObjectId: ObjectId;
  document: Record<string, TDocumentField>;
};

export type TDocumentRecord = TDbRecord<TDocument>;

export type TDocumentHistory = {
  docId: string;
  documents: TDocumentRecord[];
  metadata: TMetadataDocument;
  active: boolean;
};
