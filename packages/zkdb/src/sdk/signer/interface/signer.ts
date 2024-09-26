import { PrivateKey } from 'o1js';
import { MinaTransaction } from '../../types/o1js.js';
import { SignedData } from '../../../types';

export interface Signer {
  signTransaction(
    _transaction: MinaTransaction,
    _otherKeys: PrivateKey[]
  ): Promise<MinaTransaction>;
  signMessage(_message: string): Promise<SignedData>;
}
