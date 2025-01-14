import { ObjectId } from 'mongodb';
import type { JsonProof } from 'o1js';
import { TCollectionRequest } from './collection.js';
import { TDbRecord } from './common.js';
import { TDatabaseRequest, TMetadataDatabase } from './database.js';
import { TRollUpOffChainRecord, TRollupSerializedProof } from './rollup.js';
import { TTransitionLogRecord } from './transition-log.js';

/**
 * Ownership types
 * @typedef EProofDatabaseStatus
 * @param {string} None - No proof status
 * @param {string} Proving - Proof is being proved
 * @param {string} Proved - Proof has been proved
 * @param {string} Failed - Proof has failed
 * @readonly
 */
export enum EProofDatabaseStatus {
  None = 'None',
  Proving = 'Proving',
  Proved = 'Proved',
  Failed = 'Failed',
}

/**
 * Document proof status
 * @enum
 * @param {string} Queued - The proof has not been added to the queue
 * @param {string} Proving - The proof is being processed
 * @param {string} Proved - The proof has been proved
 * @param {string} Failed - The proof has failed to be proved
 * @readonly
 */
export enum EProofStatusDocument {
  Queued = 'Queued',
  Proving = 'Proving',
  Proved = 'Proved',
  Failed = 'Failed',
}

export type TWithProofStatus<T> = T & { proofStatus: EProofStatusDocument };

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

export type TProofStatusDocumentResponse = EProofStatusDocument;

// Database's proof status
export type TProofStatusDatabaseRequest = TDatabaseRequest;

export type TProofStatusDatabaseResponse = EProofDatabaseStatus;

// ZK Proof of Database
export type TZkProofRequest = TDatabaseRequest;

export type TZkProofResponse = TRollupSerializedProof | null;

export type TRollUpOffChainAndTransitionAggregate = TRollUpOffChainRecord & {
  transition: TTransitionLogRecord;
};
