import { TCollectionRequest } from './collection';
import { TDatabaseRequest } from './database';
import { EQueueTaskStatus } from './queue';
import {
  TRollUpOffChainRecord,
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
export type TProofStatusDocumentRequest = TCollectionRequest & {
  docId: string;
};

export type TProofStatusDocumentResponse = EQueueTaskStatus;

// Database's/ZK proof status
export type TZkProofStatusRequest = TDatabaseRequest;

export type TZkProofStatusResponse = EQueueTaskStatus | null;

// ZK Proof of Database
export type TZkProofRequest = TDatabaseRequest;

export type TZkProofResponse = TRollupSerializedProof | null;

export type TRollUpOffChainAndTransitionAggregate = TRollUpOffChainRecord & {
  transition: TTransitionLogRecord;
};
