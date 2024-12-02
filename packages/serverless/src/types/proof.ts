export enum EDatabaseProofStatus {
  Empty = 'EMPTY',
  Pending = 'PENDING',
  Proved = 'PROVED',
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
