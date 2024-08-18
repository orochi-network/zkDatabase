import {
  PrivateKey,
  PendingTransactionPromise,
  PublicKey,
  JsonProof,
} from 'o1js';
import { MinaBlockchain } from '../interfaces/blockchain.js';
import { DatabaseContractWrapper } from '../../../sdk/smart-contract/database-contract-wrapper.js';

export class MinaBlockchainImpl implements MinaBlockchain {
  async deployZKDatabaseSmartContract(
    merkleHeight: number,
    zkAppKey: PrivateKey
  ): Promise<PendingTransactionPromise> {
    const instance = DatabaseContractWrapper.getInstance(
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
      merkleHeight,
      PublicKey.fromPrivateKey(zkAppKey)
    );

    return instance.rollUp(jsonProof, zkAppKey);
  }
}
