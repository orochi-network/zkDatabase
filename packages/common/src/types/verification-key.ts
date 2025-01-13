import { TDbRecord } from './common';

// It's a serialize version of VerificationKey from o1js hash: Field => hash: string
export type TVerificationKeySerialized = {
  data: string;
  hash: string;
};

export enum EVerificationKeyType {
  VkRollup = 'vkRollup',
  VkContract = 'vkContract',
}

// NOTE: Consider does Hash from VerificationKey is a hash of the VerificationKey itself or not
// so we don't need to use verificationKeyHash field
// Since the o1js document too ambiguous
// Refer to: https://docs.minaprotocol.com/zkapps/o1js-reference/classes/VerificationKey#hash
export type TZkDbVerificationKey = {
  verificationKeyHash: string;
  verificationKey: TVerificationKeySerialized;
  type: EVerificationKeyType;
};

export type TZkDbVerificationKeyRecord = TDbRecord<TZkDbVerificationKey>;
