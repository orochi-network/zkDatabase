import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
import { TCollectionRequest } from './collection.js';
import { TDbRecord } from './common.js';
import { TMerkleProof } from './merkle-tree.js';
import { TMetadataDetail, TMetadataDocument } from './metadata.js';
import { TPagination, TPaginationReturn } from './pagination.js';

export type TDocumentField = TContractSchemaField;

export type TDocument = {
  docId: string;
  active: boolean;
  previousObjectId: ObjectId;
  document: Record<string, TDocumentField>;
};

export type TDocumentResponse = TMerkleProof[];

export type TDocumentRecord = TDbRecord<TDocument>;

/** Type derived from the base document record type, but with optional fields
 *  to represent the actual object type (i.e. nullable). */
export type TDocumentRecordOptional = Omit<
  TDocumentRecord,
  'previousObjectId'
> & {
  previousObjectId: ObjectId | null;
};

/** Same with [TDocumentRecordOptional], but `document` field is an array
 *  instead of a Record like in our database, the motivation is to make it
 *  typable in GraphQL since GraphQL does not support Record type. */
export type TDocumentFindResponse = Omit<
  TDocumentRecordOptional,
  'document'
> & {
  document: TDocumentField[];
};

export type TDocumentHistory = {
  docId: string;
  documents: TDocumentFindResponse[];
  metadata: TMetadataDocument;
  active: boolean;
};

export type TDocumentWithMetadataResponse = TMetadataDetail<
  TDocumentRecordOptional,
  TMetadataDocument
>;

export type TDocumentListRequest = TCollectionRequest & {
  query: { [key: string]: string };
  pagination: TPagination;
};

export type TDocumentListFindResponse = TPaginationReturn<
  Array<TDocumentResponse>
>;

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

export type TDocumentHistoryFindRequest = TCollectionRequest & {
  docId: string;
};

export type TDocumentHistoryListRequest = TCollectionRequest & {
  pagination: TPagination;
};

export type TDocumentHistoryListResponse = TDocumentHistory[];
