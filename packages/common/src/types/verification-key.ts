import { TDbRecord } from './common';

export type TVerificationKey = {
  verificationKeyHash: string;
  verificationKey: string;
};

export type TVerificationKeyRecord = TDbRecord<TVerificationKey>;
