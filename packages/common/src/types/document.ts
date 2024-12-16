import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
import { TCollectionRequest } from './collection.js';
import { TDbRecord, TNullable } from './common.js';
import { TMerkleProof } from './merkle-tree.js';
import { TMetadataDetail, TMetadataDocument } from './metadata.js';
import { TPagination, TPaginationReturn } from './pagination.js';

export type TDocumentField = TContractSchemaField;

export type TDocument = {
  docId: string;
  active: boolean;
  previousObjectId: ObjectId;
  // This field will be JSON in graphql
  document: Record<string, TDocumentField>;
};

export type TDocumentRecord = TDbRecord<TDocument>;

/** Type derived from the base document record type, but with optional fields
 *  to represent the actual object type (i.e. nullable). */
export type TDocumentRecordNullable = TNullable<
  TDocumentRecord,
  'previousObjectId'
>;

export type TDocumentHistory = {
  docId: string;
  documentRevision: TDocumentRecordNullable[];
  metadata: TMetadataDocument;
  active: boolean;
};

export type TDocumentWithMetadataResponse = TMetadataDetail<
  TDocumentRecordNullable,
  TMetadataDocument
>;

export type TDocumentListRequest = TCollectionRequest & {
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
  document: Record<string, TDocumentField>;
  documentPermission: number;
};

export type TDocumentUpdateRequest = TCollectionRequest & {
  query: { [key: string]: string };
  document: Record<string, TDocumentField>;
};

export type TDocumentHistoryFindRequest = TCollectionRequest & {
  docId: string;
};

export type TDocumentHistoryListRequest = TCollectionRequest & {
  docId: string;
  pagination: TPagination;
};

export type TDocumentHistoryResponse = TDocumentHistory;
