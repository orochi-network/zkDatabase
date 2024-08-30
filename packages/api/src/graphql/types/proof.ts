export type ZKProof = {
  publicInput: string[];
  publicOutput: string[];
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
};

export enum ProofStatus {
  QUEUED = "QUEUED",
  PROVING = "PROVING",
  PROVED = "PROVED",
  FAILED = "FAILED"
}