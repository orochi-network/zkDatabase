import { PrivateKey } from 'o1js';
import { MinaTransaction } from '../types/o1js.js';
import { AuroWallet } from '../wallet/auro-wallet.js';
import { Signer } from './interface/signer.js';
import { SignedData } from 'src/types/signing.js';

export class AuroWalletSigner implements Signer {
  async signTransaction(
    transaction: MinaTransaction,
    otherKeys: PrivateKey[]
  ): Promise<MinaTransaction> {
    transaction.sign(otherKeys);
    return AuroWallet.signTransaction(transaction);
  }

  async signMessage(message: string): Promise<SignedData> {
    return AuroWallet.signMessage(message);
  }
}
