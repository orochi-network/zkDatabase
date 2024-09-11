export type WithProofStatus<T> = T & { proofStatus: string };

export type Signature = {
  signature: {
    field: string;
    scalar: string;
  };
  publicKey: string;
  data: string;
};
