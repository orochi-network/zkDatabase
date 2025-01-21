import { TNullable } from './common';

export enum EDocumentOperation {
  Create = 'Create',
  Update = 'Update',
  Drop = 'Drop',
}

export type TDocumentQueuedData = {
  collectionName: string;
  operationKind: EDocumentOperation;
  newDocumentHash?: string;
  merkleIndex: bigint;
  docId: string;
  documentObjectIdPrevious: string | null;
  documentObjectIdCurrent: string | null;
};

export enum EQueueTaskStatus {
  Queued = 'Queued',
  Processing = 'Processing',
  Failed = 'Failed',
  Success = 'Success',
  Unknown = 'Unknown',
}

export type TGenericQueueBase<T> = {
  databaseName: string;
  sequenceNumber: bigint;
  status: EQueueTaskStatus;
  data: T;
  error: any;
  acquiredAt: Date;
};

// Sequence number is used to order tasks within the same database, if user
// of this model doesn't need to maintain order, she can set it to null on
// task creation.
export type TGenericQueue<T> = TNullable<
  TGenericQueueBase<T>,
  'sequenceNumber' | 'error' | 'acquiredAt'
>;
