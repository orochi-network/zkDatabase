import { ZKDatabaseSmartContractWrapper } from '@zkdb/smart-contract';
import {
  JsonProof,
  PendingTransactionPromise,
  PrivateKey,
  PublicKey,
} from 'o1js';
import { getSigner } from '../signer/signer.js';
import { ZKDatabaseClient } from '../global/zkdatabase-client.js';

export class DatabaseContractWrapper {
  private zkDatabaseSmartContact: ZKDatabaseSmartContractWrapper;

  private constructor(merkleHeight: number, appPublicKey: PublicKey) {
    this.zkDatabaseSmartContact = new ZKDatabaseSmartContractWrapper(
      merkleHeight,
      appPublicKey
    );
  }

  private static instances: Map<string, DatabaseContractWrapper> = new Map();

  static getInstance(
    merkleHeight: number,
    appAddress: PublicKey
  ): DatabaseContractWrapper {
    const key = `${appAddress}_${merkleHeight}`;
    if (!DatabaseContractWrapper.instances.has(key)) {
      DatabaseContractWrapper.instances.set(
        key,
        new DatabaseContractWrapper(merkleHeight, appAddress)
      );
    }
    return DatabaseContractWrapper.instances.get(key)!;
  }

  async deploy(appKey: PrivateKey): Promise<PendingTransactionPromise> {
    await this.zkDatabaseSmartContact.compile();

    const user = ZKDatabaseClient.currentUser;

    if (user) {
      let tx =
        await this.zkDatabaseSmartContact.createAndProveDeployTransaction(
          PublicKey.fromBase58(user.publicKey)
        );

      tx = await getSigner().signTransaction(tx, [appKey]);
      const pendingTx = await tx.send();
      return pendingTx;
    }

    throw Error('User is null');
  }

  async rollUp(
    jsonProof: JsonProof,
    zkAppPrivateKey: PrivateKey
  ): Promise<PendingTransactionPromise> {
    await this.zkDatabaseSmartContact.compile();

    let tx =
      await this.zkDatabaseSmartContact.createAndProveRollUpTransaction(
        jsonProof
      );
    tx = await getSigner().signTransaction(tx, [zkAppPrivateKey]);
    return await tx.send();
  }
}
