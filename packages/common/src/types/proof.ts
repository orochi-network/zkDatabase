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
export type TMerkleProofDocumentRequest = TCollectionRequest & {
  docId: string;
};
export type TMerkleProofDocumentResponse = EQueueTaskStatus;

export type TZkProofDocumentRequest = TMerkleProofDocumentRequest;
export type TZkProofDocumentResponse = EQueueTaskStatus;

// Database's/ZK proof status
export type TZkProofStatusRequest = TDatabaseRequest;

export type TZkProofStatusResponse = EQueueTaskStatus | null;

// ZK Proof of Database
export type TZkProofRequest = TDatabaseRequest;

export type TZkProofResponse = TRollupSerializedProof | null;

export type TRollUpOffChainAndTransitionAggregate = TRollUpOffChainRecord & {
  transition: TTransitionLogRecord;
};
