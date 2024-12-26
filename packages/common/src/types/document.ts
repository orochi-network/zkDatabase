import type { ObjectId } from 'mongodb';
import { TSchemaSerializedField } from '../schema.js';
import { TDbRecord, TNullable } from './common.js';
import { TMerkleProof } from './merkle-tree.js';
import { TDocumentMetadata } from './metadata.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { EProofStatusDocument } from './proof.js';

export type TDocumentField = TSchemaSerializedField;

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

export type TDocumentResponse = TDocumentRecordNullable;

export type TDocumentNamespace = {
  databaseName: string;
  collectionName: string;
};

export type TDocumentFindRequest = TDocumentNamespace & {
  query?: { [key: string]: string };
  pagination?: TPagination;
};

// metadata and proofStatus's presence depends on whether the graphql client
// requests them or not
export type TDocumentFindResponse = TPaginationReturn<
  Array<
    TDocumentResponse & {
      metadata?: TDocumentMetadata;
      proofStatus?: EProofStatusDocument;
    }
  >
>;

export type TDocumentCreateRequest = TDocumentNamespace & {
  document: Record<string, TDocumentField>;
  documentPermission?: number;
};

export type TDocumentCreateResponse = {
  docId: string;
  acknowledged: boolean;
  merkleProof: TMerkleProof[];
};

export type TDocumentUpdateRequest = TDocumentNamespace & {
  docId: string;
  document: Record<string, TDocumentField>;
};

export type TDocumentUpdateResponse = TMerkleProof[];

export type TDocumentDropRequest = TDocumentUpdateRequest;
export type TDocumentDropResponse = TMerkleProof[];

export type TDocumentHistoryFindRequest = TDocumentNamespace & {
  docId: string;
  pagination?: TPagination;
};
export type TDocumentHistoryFindResponse = TPaginationReturn<
  TDocumentResponse[]
>;
