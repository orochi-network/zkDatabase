export type SignedData = {
  publicKey: string;
  data: string;
  signature: {
    field: string;
    scalar: string;
  };
};
