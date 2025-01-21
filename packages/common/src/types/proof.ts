import { TCollectionRequest } from './collection';
import { TDatabaseRequest } from './database';
import { EQueueTaskStatus } from './queue';
import {
  TRollupOffChainRecord,
  TRollupSerializedProof,
} from './rollup-offchain';
import { TTransitionLogRecord } from './transition-log';

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

// Database's/ZK proof status
export type TZkProofStatusRequest = TDatabaseRequest;

export type TZkProofStatusResponse = EQueueTaskStatus;

// ZK Proof of Database
export type TZkProofRequest = TDatabaseRequest;

export type TZkProofResponse = TRollupSerializedProof | null;

export type TRollUpOffChainAndTransitionAggregate = TRollupOffChainRecord & {
  transition: TTransitionLogRecord;
};
