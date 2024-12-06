import { ObjectId } from 'mongodb';
import { TContractSchemaField } from '../schema.js';
import { TDbRecord } from './common.js';

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
  metadata: TDocumentHistoryMetadata;
  active: boolean;
};

export type TDocumentHistoryMetadata = {
  permission: boolean;
  merkleIndex: number;
  group: string;
  owner: string;
};
