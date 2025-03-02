import { TCollectionRequest } from './collection';
import { TDatabaseRequest } from './database';
import { EQueueTaskStatus } from './queue';
import { TRollupSerializedProof } from './rollup-offchain';

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
export type TZkProofRequest = TDatabaseRequest & { step?: bigint };

// Step and proof would be enough, since all Merkle root info already in JsonProof
export type TZkProofResponse = Omit<
  TRollupSerializedProof,
  'merkleRootOld'
> | null;

export type TProverStatusRequest = TDatabaseRequest;

export type TProverStatusResponse = EQueueTaskStatus;

export type TProverRetryRequest = TDatabaseRequest;

export type TProverRetryResponse = boolean;
