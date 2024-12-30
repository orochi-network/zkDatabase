import { UInt64 } from 'mina-signer/dist/node/mina-signer/src/types';
import { PrivateKey, Transaction } from 'o1js';
import { SignedLegacy } from 'o1js/dist/node/mina-signer/src/types';

export type TransactionParams = {
  fee: UInt64;
  memo?: string;
};

export interface Signer {
  signTransaction(
    _transaction: Transaction<false, false>,
    _otherKeys: PrivateKey[]
  ): Promise<Transaction<false, true>>;

  signAndSendTransaction(
    transaction: string,
    params: TransactionParams
  ): Promise<string>;

  signMessage(_message: string): Promise<SignedLegacy<string>>;
}
