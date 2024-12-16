import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
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

export type TDocumentResponse = TDocumentRecordNullable;

export type TDocumentWithMetadataResponse = TMetadataDetail<
  TDocumentResponse,
  TMetadataDocument
>;

export type TDocumentNamespace = {
  databaseName: string;
  collectionName: string;
};

export type TDocumentListRequest = TDocumentNamespace & {
  query: { [key: string]: string };
  pagination: TPagination;
};

export type TDocumentMerkleProofResponse = TMerkleProof[];

export type TDocumentListFindResponse =
  TPaginationReturn<TDocumentMerkleProofResponse>;

export type TDocumentFindRequest = TDocumentNamespace & {
  query: { [key: string]: string };
};

export type TDocumentCreateRequest = TDocumentNamespace & {
  document: Record<string, TDocumentField>;
  documentPermission: number;
};

export type TDocumentUpdateRequest = TDocumentNamespace & {
  query: { [key: string]: string };
  document: Record<string, TDocumentField>;
};

export type TDocumentHistoryFindRequest = TDocumentNamespace & {
  docId: string;
};

export type TDocumentHistoryListRequest = TDocumentNamespace & {
  docId: string;
  pagination: TPagination;
};

export type TDocumentHistoryResponse = TDocumentHistory;
export type TDocumentHistoryListResponse = TDocumentHistoryResponse[];
