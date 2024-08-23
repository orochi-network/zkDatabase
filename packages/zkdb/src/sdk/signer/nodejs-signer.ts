import { PrivateKey } from 'o1js';
import { Signer } from './interface/signer.js';
import { MinaTransaction } from '../types/o1js.js';
import { SignedData } from 'src/types/signing.js';
import Client from 'mina-signer';

export class NodeSigner implements Signer {
  private privateKey: PrivateKey;
  private client: Client;

  constructor(privateKey: PrivateKey) {
    this.privateKey = privateKey;
    this.client = new Client({ network: 'testnet' });
  }

  async signTransaction(
    transaction: MinaTransaction,
    otherKeys: PrivateKey[]
  ): Promise<MinaTransaction> {
    transaction.sign(otherKeys.concat(this.privateKey));
    return transaction;
  }

  async signMessage(message: string): Promise<SignedData> {
    return this.client.signMessage(message, this.privateKey.toBase58());
  }
}
