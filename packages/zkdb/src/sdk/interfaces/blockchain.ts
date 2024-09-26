/* eslint-disable no-unused-vars */
import { JsonProof, PendingTransactionPromise, PrivateKey } from 'o1js';

export interface MinaBlockchain {
  deployZKDatabaseSmartContract(
    merkleHeight: number,
    zkAppKey: PrivateKey
  ): Promise<PendingTransactionPromise>;

  rollUpZKDatabaseSmartContract(
    merkleHeight: number,
    zkAppKey: PrivateKey,
    jsonProof: JsonProof
  ): Promise<PendingTransactionPromise>;
}
