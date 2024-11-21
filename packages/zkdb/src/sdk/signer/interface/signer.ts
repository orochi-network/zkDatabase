import { PrivateKey } from 'o1js';
import { MinaTransaction } from '../../types/o1js.js';
import { SignedData } from '../../../types';
import { TransactionParams } from '../../../types/transaction-params.js';

export interface Signer {
  signTransaction(
    _transaction: MinaTransaction,
    _otherKeys: PrivateKey[]
  ): Promise<MinaTransaction>;
  signAndSendTransaction(transaction: string, params: TransactionParams): Promise<string>
  signMessage(_message: string): Promise<SignedData>;
}
