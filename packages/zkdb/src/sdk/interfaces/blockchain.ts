/* eslint-disable no-unused-vars */
import { PendingTransactionPromise, PrivateKey, JsonProof } from 'o1js';
import ZKDatabaseClient from '../global/zkdatabase-client.js';

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
