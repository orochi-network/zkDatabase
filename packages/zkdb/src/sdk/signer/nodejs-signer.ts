import { PrivateKey } from 'o1js';
import { Signer } from './interface/signer.js';
import { MinaTransaction } from '../types/o1js.js';

export class NodeSigner implements Signer {
  private privateKey: PrivateKey;

  constructor(privateKey: PrivateKey) {
    this.privateKey = privateKey;
  }

  async signTransaction(
    transaction: MinaTransaction,
    otherKeys: PrivateKey[]
  ): Promise<MinaTransaction> {
    transaction.sign(otherKeys.concat(this.privateKey));
    return transaction;
  }
}
