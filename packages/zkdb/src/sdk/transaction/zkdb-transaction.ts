import { IApiClient } from '@zkdb/api';
import {
  TDbTransaction,
  transactionOrder,
  TWaitTransactionStatus,
} from '../../types/transaction';
import { isBrowser } from '@utils';
import { PrivateKey } from 'o1js';
import { AuroWalletSigner, NodeSigner, Signer } from '../signer';
import { TransactionParams } from '../../types/transaction-params';

const DEFAULT_FEE = 100_000_000;

export class ZkDbTransaction {
  private transaction: TDbTransaction;
  private apiClient: IApiClient;
  private signer: Signer;
  private txHash: string;

  constructor(
    transaction: TDbTransaction,
    apiClient: IApiClient,
    signer: Signer
  ) {
    this.transaction = transaction;
    this.apiClient = apiClient;
    this.signer = signer;
  }

  public async update() {
    if (
      this.transaction.status === 'success' ||
      this.transaction.status === 'failed'
    ) {
      throw Error(
        `Update is unnecessary. Transaction is already ${this.transaction.status}`
      );
    }

    const result = await this.apiClient.transaction.getTransactionById({
      id: this.transaction.id,
    });

    this.transaction = result.unwrap();
  }

  public async wait(status: TWaitTransactionStatus) {
    if (status === this.transaction.status) {
      return;
    }

    if (
      transactionOrder.get(status)! >
      transactionOrder.get(this.transaction.status)!
    ) {
      return new Promise<void>((resolve, reject) => {
        const checkStatus = async () => {
          try {
            await this.update();

            if (this.transaction.status === status) {
              resolve();
            } else if (this.transaction.status === 'failed') {
              throw Error(this.transaction.error);
            } else {
              setTimeout(checkStatus, 3000);
            }
          } catch (error) {
            reject(error);
          }
        };

        checkStatus();
      });
    } else {
      throw Error('Wrong status order');
    }
  }

  public async signAndSend(
    transactionParams: TransactionParams = {
      fee: DEFAULT_FEE,
      memo: '',
    }
  ): Promise<string> {
    if (this.transaction.status !== 'ready') {
      throw Error('To sign transaction its status must be ready');
    }

    this.txHash = await this.signer.signAndSendTransaction(
      this.transaction.tx,
      transactionParams
    );

    if (!this.txHash) {
      throw Error('Failed to acquire transaction hash');
    }

    const result = await this.apiClient.transaction.confirmTransaction({
      databaseName: this.transaction.databaseName,
      confirmTransactionId: this.transaction.id,
      txHash: this.txHash,
    });

    const isConfirmed = result.unwrap();

    if (!isConfirmed) {
      throw Error(`Failed to confirm transaction`);
    }

    return this.txHash;
  }

  public async retryConfirm(): Promise<boolean> {
    if (this.transaction.status === 'ready' && this.txHash) {
      const result = await this.apiClient.transaction.confirmTransaction({
        databaseName: this.transaction.databaseName,
        confirmTransactionId: this.transaction.id,
        txHash: this.txHash,
      });

      const isConfirmed = result.unwrap();

      return isConfirmed;
    } else {
      return false;
    }
  }

  public get status() {
    return this.transaction.status;
  }

  public get transactionHash() {
    return this.txHash;
  }
}
