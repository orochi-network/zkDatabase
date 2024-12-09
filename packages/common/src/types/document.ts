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

export type TDocumentRecordResponse = Omit<
  TDocumentRecord,
  'previousObjectId'
> & {
  previousObjectId?: ObjectId;
};

export type TDocumentReadResponse = Pick<
  TDocumentRecordResponse,
  'docId' | 'document' | 'createdAt'
>;

export type TDocumentHistory = {
  docId: string;
  documents: TDocumentRecordResponse[];
  metadata: TMetadataDocument;
  active: boolean;
};
