import { Mina } from 'o1js';
import { SignedData } from '../../types';
import { isBrowser } from '../../utils';
import { TransactionParams } from '../../types/transaction-params';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

export class AuroWallet {
  private constructor() {}

  static async signMessage(signContent: string): Promise<SignedData> {
    this.ensureWalletSupport();

    const signResult = await (window as any).mina
      .signMessage(signContent)
      .catch((err: any) => err);

    return signResult;
  }

  static async signAndSendTransaction(
    transaction: string,
    transactionMetadata: TransactionParams = {
      fee: 0.1,
      memo: '',
    }
  ): Promise<string> {
    this.ensureWalletSupport();

    const { hash } = await (window as any).mina.sendTransaction({
      transaction: transaction,
      feePayer: {
        fee: transactionMetadata.fee,
        memo: transactionMetadata.memo,
      },
    });

    return hash;
  }

  static async signTransaction(
    transaction: Transaction,
    transactionMetadata: TransactionParams = {
      fee: 0.1,
      memo: '',
    }
  ): Promise<Transaction> {
    this.ensureWalletSupport();

    const { signedData } = await (window as any).mina.sendTransaction({
      onlySign: true,
      transaction: transaction.toJSON(),
      feePayer: {
        fee: transactionMetadata.fee,
        memo: transactionMetadata.memo,
      },
    });

    return Mina.Transaction.fromJSON(signedData);
  }

  private static ensureWalletSupport() {
    if (!isBrowser()) {
      throw Error(
        'Unable to connect to Auro Wallet in a non-browser environment'
      );
    }

    const mina = (window as any).mina;

    if (mina === null) {
      throw Error(
        'Auro Wallet extension is not detected. Please install the Auro Wallet extension and refresh the page to continue.'
      );
    }
  }
}
