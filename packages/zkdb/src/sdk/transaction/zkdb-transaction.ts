import { IApiClient } from '@zkdb/api';
import {
  TDbTransaction,
  transactionOrder,
  TWaitTransactionStatus,
} from '../../types/transaction';
import { isBrowser } from '@utils';
import { PrivateKey } from 'o1js';
import { AuroWalletSigner, NodeSigner } from '../signer';
import { TransactionParams } from '../../types/transaction-params';
import { Environment } from '../global/environment';

export class ZkDbTransaction {
  private transaction: TDbTransaction;
  private apiClient: IApiClient;
  private environment: Environment;
  private txHash: string;

  constructor(
    transaction: TDbTransaction,
    apiClient: IApiClient,
    environment: Environment
  ) {
    this.transaction = transaction;
    this.apiClient = apiClient;
    this.environment = environment;
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

    const result = await this.apiClient.transaction.getTransaction({
      databaseName: this.transaction.databaseName,
      transactionType: this.transaction.transactionType,
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
    privateKey?: PrivateKey,
    transactionParams: TransactionParams = {
      fee: 0.1,
      memo: '',
    }
  ): Promise<string> {
    if (this.transaction.status !== 'ready') {
      throw Error('To sign transaction its status must be ready');
    }

    if (privateKey) {
      const { networkId } = this.environment.getEnv();

      this.txHash = await NodeSigner.getInstance(
        networkId
      ).signAndSendTransaction(
        this.transaction.tx,
        transactionParams,
        privateKey
      );
    } else if (isBrowser()) {
      this.txHash = await AuroWalletSigner.getInstance().signAndSendTransaction(
        this.transaction.tx,
        transactionParams
      );
    } else {
      throw Error('You should pass the private key to sign the transaction');
    }

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

  public getStatus() {
    return this.transaction.status;
  }

  public getTxHash() {
    return this.txHash;
  }
}
