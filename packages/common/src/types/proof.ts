import { TCollectionRequest } from './collection.js';

/**
 * Ownership types
 * @typedef EDatabaseProofStatus
 * @param {string} None - No proof status
 * @param {string} Proving - Proof is being proved
 * @param {string} Proved - Proof has been proved
 * @param {string} Failed - Proof has failed
 * @readonly
 */
export enum EDatabaseProofStatus {
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
export enum EDocumentProofStatus {
  Queued = 'Queued',
  Proving = 'Proving',
  Proved = 'Proved',
  Failed = 'Failed',
}

export type TWithProofStatus<T> = T & { proofStatus: EDatabaseProofStatus };

export type TMinaSignature = {
  signature: {
    field: string;
    scalar: string;
  };
  publicKey: string;
  data: string;
};

export type TZKDatabaseProof = {
  publicInput: string[];
  publicOutput: string[];
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
};

export type TDocumentProofRequest = TCollectionRequest & {
  docId: string;
};
