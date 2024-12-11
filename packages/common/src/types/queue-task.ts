import { TDbRecord } from './common';
import { EDocumentProofStatus } from './proof';

export type TQueueTask = {
  operationNumber: number;
  // Since MongoDB natively supports a 64-bit integer type called Int64 or long
  // If exceeds 64 bits, should change it to string
  merkleIndex: bigint;
  hash: string;
  status: EDocumentProofStatus;
  database: string;
  collection: string;
  docId: string;
  merkleRoot: string;
  error?: string;
};

export type TQueueTaskRecord = TDbRecord<TQueueTask>;
