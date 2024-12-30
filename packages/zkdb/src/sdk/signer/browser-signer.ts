import { PrivateKey, Transaction } from 'o1js';
import { SignedLegacy } from 'o1js/dist/node/mina-signer/src/types';
import { AuroWallet } from './auro-wallet';
import { Signer, TransactionParams } from './interface/signer';

export class AuroWalletSigner implements Signer {
  async signAndSendTransaction(
    transaction: string,
    params: TransactionParams
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async signTransaction(
    transaction: Transaction<false, false>,
    otherKeys: PrivateKey[]
  ): Promise<Transaction<false, true>> {
    transaction.sign(otherKeys);
    return new AuroWallet().signTransaction(transaction, { fee: '0.1' });
  }

  async signMessage(message: string): Promise<SignedLegacy<string>> {
    return new AuroWallet().signMessage(message);
  }
}
