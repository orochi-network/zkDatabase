import { TCollectionRequest } from './collection.js';
import { TDatabaseRequest } from './database.js';
import { EQueueTaskStatus } from './queue.js';
import { TRollUpOffChainRecord, TRollupSerializedProof } from './rollup.js';
import { TTransitionLogRecord } from './transition-log.js';

export type TWithQueueStatus<T> = T & { queueStatus: EQueueTaskStatus };

export type TMinaSignature = {
  signature: {
    field: string;
    scalar: string;
  };
  publicKey: string;
  data: string;
};

// Document's proof status
export type TProofStatusDocumentRequest = TCollectionRequest & {
  docId: string;
};

export type TProofStatusDocumentResponse = EQueueTaskStatus;

// Database's proof status
export type TProofStatusDatabaseRequest = TDatabaseRequest;

export type TProofStatusDatabaseResponse = EQueueTaskStatus | null;

// ZK Proof of Database
export type TZkProofRequest = TDatabaseRequest;

export type TZkProofResponse = TRollupSerializedProof | null;

export type TRollUpOffChainAndTransitionAggregate = TRollUpOffChainRecord & {
  transition: TTransitionLogRecord;
};
