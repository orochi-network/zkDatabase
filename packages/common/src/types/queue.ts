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
};

export enum EQueueTaskStatus {
  Queued = 'Queued',
  Processing = 'Processing',
  Failed = 'Failed',
  Success = 'Success',
}

export type TGenericQueueBase<T> = {
  databaseName: string;
  sequenceNumber: number;
  status: EQueueTaskStatus;
  data: T;
  error: any;
  acquiredAt: Date;
};
