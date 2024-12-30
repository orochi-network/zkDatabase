import type { ObjectId } from 'mongodb';
import { TSchemaSerializedField, TSerializedValue } from '../schema.js';
import { TDbRecord, TNullable } from './common.js';
import { TMerkleProof } from './merkle-tree.js';
import { TDocumentMetadata } from './metadata.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { EProofStatusDocument } from './proof.js';
import { TCollectionRequest } from './collection.js';

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

export type TDocumentFindRequest = TCollectionRequest & {
  query?: Record<string, TSerializedValue>;
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

export type TDocumentCreateRequest = TCollectionRequest & {
  document: Record<string, TSerializedValue>;
  documentPermission?: number;
};

export type TDocumentCreateResponse = {
  docId: string;
  acknowledged: boolean;
  merkleProof: TMerkleProof[];
};

export type TDocumentUpdateRequest = TCollectionRequest & {
  docId: string;
  document: Record<string, TSerializedValue>;
};

export type TDocumentUpdateResponse = TMerkleProof[];

export type TDocumentDropRequest = TCollectionRequest & {
  docId: string;
};

export type TDocumentDropResponse = TMerkleProof[];

export type TDocumentHistoryFindRequest = TCollectionRequest & {
  docId: string;
  pagination?: TPagination;
};

export type TDocumentHistoryFindResponse = TPaginationReturn<
  TDocumentResponse[]
>;
