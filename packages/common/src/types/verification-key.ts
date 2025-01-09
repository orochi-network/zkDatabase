import { VerificationKey } from 'o1js';
import { TDbRecord } from './common';

// It's a serialize version of VerificationKey from o1js hash: Field => hash: string
export type TVerificationKeySerialized = {
  data: string;
  hash: string;
};

export type TZkDbVerificationKey = {
  verificationKeyHash: string;
  verificationKey: TVerificationKeySerialized;
  contractName: string;
};

export type TZkDbVerificationKeyRecord = TDbRecord<TZkDbVerificationKey>;
