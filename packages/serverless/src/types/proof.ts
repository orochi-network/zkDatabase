export enum EDatabaseProofStatus {
  None,
  Proving,
  Proved,
  Failed,
}

export type TWithProofStatus<T> = T & { proofStatus: EDatabaseProofStatus };

export type TSignature = {
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

export enum EDocumentProofStatus {
  // The proof has not been added to the queue
  Queued,
  // The proof is being processed
  Proving,
  // The proof has been proved
  Proved,
  // The proof has failed to be proved
  Failed,
}
