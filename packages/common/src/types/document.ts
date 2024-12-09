import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
import { TDbRecord } from './common.js';
import { TMetadataDocument } from './metadata.js';
import { TCollectionRequest } from './collection.js';
import { TPagination } from './pagination.js';

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

export type TDocumentsFindRequest = TCollectionRequest & {
  query: { [key: string]: string };
  pagination: TPagination;
};

export type TDocumentFindRequest = TCollectionRequest & {
  query: { [key: string]: string };
};

export type TDocumentCreateRequest = TCollectionRequest & {
  document: TDocumentField[];
  documentPermission: number;
};

export type TDocumentUpdateRequest = TCollectionRequest & {
  query: { [key: string]: string };
  document: TDocumentField[];
};

export type TDocumentHistoryGetRequest = TCollectionRequest & {
  docId: string;
};

export type TDocumentHistoryListRequest = TCollectionRequest & {
  pagination: TPagination;
};

export type TDocumentHistory = {
  docId: string;
  documents: TDocumentRecordResponse[];
  metadata: TMetadataDocument;
  active: boolean;
};
