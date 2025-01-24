import { WithoutId } from 'mongodb';
import { TDbRecord } from './common';
import { TDatabaseRequest } from './database';

export enum EContractName {
  Rollup = 'Rollup',
  Contract = 'Contract',
}

// NOTE: Consider does Hash from VerificationKey is a hash of the VerificationKey itself or not
// so we don't need to use verificationKeyHash field
// Since the o1js document too ambiguous
// Refer to: https://docs.minaprotocol.com/zkapps/o1js-reference/classes/VerificationKey#hash
export type TZkDbVerificationKey = {
  merkleHeight: number;
  verificationKeyHash: string;
  hash: string;
  data: string;
  contractName: EContractName;
};

export type TZkDbVerificationKeyRecord = TDbRecord<TZkDbVerificationKey>;

export type TVerificationKeyRequest = Pick<TDatabaseRequest, 'databaseName'>;

export type TVerificationKeyResponse = Record<
  EContractName,
  WithoutId<TZkDbVerificationKeyRecord>
> | null;
