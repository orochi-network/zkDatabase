import { TNetworkId } from "./network";

export type TZKProof = {
  publicInput: string[];
  publicOutput: string[];
  maxProofsVerified: 0 | 1 | 2;
  proof: string;
};

export enum TProofStatus {
  QUEUED = "QUEUED",
  PROVING = "PROVING",
  PROVED = "PROVED",
  FAILED = "FAILED",
}

export type TProofStatusRequest = {
  networkId: TNetworkId,
  databaseName: string;
  collectionName: string;
  docId: string;
};
