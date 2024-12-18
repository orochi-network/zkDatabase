import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
import { TDbRecord, TNullable } from './common.js';
import { TMerkleProof } from './merkle-tree.js';
import { TMetadataDetail, TMetadataDocument } from './metadata.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { EProofStatusDocument } from './proof.js';

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

export type TDocumentNamespace = {
  databaseName: string;
  collectionName: string;
};

export type TDocumentFindRequest = TDocumentNamespace & {
  query: { [key: string]: string };
  pagination: TPagination;
};

// metadata and proofStatus's presence depends on whether the graphql client
// requests them or not
export type TDocumentFindResponse = TDocumentResponse & {
  metadata?: TMetadataDocument;
  proofStatus?: EProofStatusDocument;
};

export type TDocumentMerkleProofResponse = TMerkleProof[];

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

export type TDocumentModificationResponse = TMerkleProof[] | null;

export type TDocumentHistoryListRequest = TDocumentNamespace & {
  docId: string;
  pagination: TPagination;
};

export type TDocumentHistoryResponse = TDocumentHistory;
export type TDocumentHistoryListResponse = TDocumentHistoryResponse[];
