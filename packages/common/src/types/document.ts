import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
import { TCollectionRequest } from './collection.js';
import { TDbRecord } from './common.js';
import { TMerkleProof } from './merkle-tree.js';
import { TMetadataDocument } from './metadata.js';
import { TPagination, TPaginationReturn } from './pagination.js';

export type TDocumentField = TContractSchemaField;

export type TDocument = {
  docId: string;
  active: boolean;
  previousObjectId: ObjectId;
  document: Record<string, TDocumentField>;
};

export type TDocumentRecord = TDbRecord<TDocument>;

// NOTE(wonrax): I don't know why single document history does not respond with
// metadata
export type TSingleDocumentHistory = Omit<TDocumentHistory, 'metadata'>;

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
  documentRevision: TDocumentRecord[];
  metadata: TMetadataDocument;
  active: boolean;
};

export type TDocumentListFindRequest = TCollectionRequest & {
  query: { [key: string]: string };
  pagination: TPagination;
};

export type TDocumentMerkleProofResponse = TMerkleProof[];

export type TDocumentListFindResponse =
  TPaginationReturn<TDocumentMerkleProofResponse>;

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

export type TDocumentHistoryGetResponse = TSingleDocumentHistory;

export type TDocumentHistoryListRequest = TCollectionRequest & {
  pagination: TPagination;
};

export type TDocumentHistoryListResponse = TDocumentHistory[];
