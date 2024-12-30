import { isBrowser } from '@utils';
import { SignedLegacy } from 'mina-signer/dist/node/mina-signer/src/types';
import { Mina, Transaction } from 'o1js';
import { TransactionParams } from '.';

export class AuroWallet {
  private get mina() {
    if (!isBrowser()) {
      throw Error(
        'Unable to connect to Auro Wallet in a non-browser environment'
      );
    }

    if (
      typeof (window as any).mina === 'undefined' ||
      (window as any).mina === null
    ) {
      throw Error(
        'Auro Wallet extension is not detected. Please install the Auro Wallet extension and refresh the page to continue.'
      );
    }

    return (window as any).mina as any;
  }

  async signMessage(signContent: string): Promise<SignedLegacy<string>> {
    const signResult = await this.mina.signMessage(signContent);

    return signResult;
  }

  async signAndSendTransaction(
    transaction: Transaction<false, false>,
    transactionMetadata: TransactionParams
  ): Promise<string> {
    const { hash } = await this.mina.sendTransaction({
      transaction: transaction.toJSON(),
      feePayer: {
        fee: transactionMetadata.fee,
        memo: transactionMetadata.memo,
      },
    });

    return hash;
  }

  async signTransaction(
    transaction: Transaction<false, false>,
    transactionMetadata: TransactionParams
  ): Promise<Transaction<false, true>> {
    const { signedData } = await this.mina.sendTransaction({
      onlySign: true,
      transaction: transaction.toJSON(),
      feePayer: {
        fee: transactionMetadata.fee,
        memo: transactionMetadata.memo,
      },
    });

    return Mina.Transaction.fromJSON(signedData);
  }
}
