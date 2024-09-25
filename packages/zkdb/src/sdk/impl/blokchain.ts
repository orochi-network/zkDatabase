import {
  PrivateKey,
  PendingTransactionPromise,
  PublicKey,
  JsonProof,
} from 'o1js';
import { MinaBlockchain } from '../interfaces/blockchain.js';
import { DatabaseContractWrapper } from '../smart-contract/database-contract-wrapper.js';
import ZKDatabaseClient from '../global/zkdatabase-client.js';

export class MinaBlockchainImpl implements MinaBlockchain {
  #zkDatabaseClient: ZKDatabaseClient;

  constructor(zkDatabaseClient: ZKDatabaseClient) {
    this.#zkDatabaseClient = zkDatabaseClient;
  }

  async deployZKDatabaseSmartContract(
    merkleHeight: number,
    zkAppKey: PrivateKey
  ): Promise<PendingTransactionPromise> {
    const instance = DatabaseContractWrapper.getInstance(
      this.#zkDatabaseClient,
      merkleHeight,
      PublicKey.fromPrivateKey(zkAppKey)
    );

    return instance.deploy(zkAppKey);
  }

  async rollUpZKDatabaseSmartContract(
    merkleHeight: number,
    zkAppKey: PrivateKey,
    jsonProof: JsonProof
  ): Promise<PendingTransactionPromise> {
    const instance = DatabaseContractWrapper.getInstance(
      this.#zkDatabaseClient,
      merkleHeight,
      PublicKey.fromPrivateKey(zkAppKey)
    );

    return instance.rollUp(jsonProof, zkAppKey);
  }
}
