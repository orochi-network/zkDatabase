import { PrivateKey } from 'o1js';
import { MinaTransaction } from '../types/o1js';
import { Signer } from './interface/signer';
import { SignedData } from '@types';
import { AuroWallet } from '../wallet/auro-wallet';
import { TransactionParams } from '../../types/transaction-params';

export class AuroWalletSigner {
  private static INSTANCE: AuroWalletSigner;

  public static getInstance() {
    if (!AuroWalletSigner.INSTANCE) {
      AuroWalletSigner.INSTANCE = new AuroWalletSigner();
    }

    return AuroWalletSigner.INSTANCE;
  }

  async signAndSendTransaction(transaction: string, params: TransactionParams): Promise<string> {
   return AuroWallet.signAndSendTransaction(transaction, params)
  }
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
