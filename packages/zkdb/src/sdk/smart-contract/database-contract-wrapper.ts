import {
  ZKDatabaseSmartContract,
  getZkDbSmartContractClass,
} from '@zkdb/smart-contract';
import { JsonProof, PrivateKey, PublicKey } from 'o1js';
import { getSigner } from '../signer/signer.js';

export class DatabaseContractWrapper {
  private zkDatabaseSmartContact: ZKDatabaseSmartContract;
  private appAddress: PublicKey;

  private isCompiled: boolean;

  private constructor(
    databaseName: string,
    merkleHeight: number,
    publicKey: PublicKey,
    appPublicKey: PublicKey
  ) {
    this.zkDatabaseSmartContact = getZkDbSmartContractClass(
      databaseName,
      merkleHeight,
      publicKey
    );
    this.appAddress = appPublicKey;
  }

  private static instances: Map<string, DatabaseContractWrapper> = new Map();

  static getInstance(
    databaseName: string,
    merkleHeight: number,
    deployerAddress: PublicKey,
    appAddress: PublicKey
  ): DatabaseContractWrapper {
    const key = `${databaseName}_${merkleHeight}`;
    if (!DatabaseContractWrapper.instances.has(key)) {
      DatabaseContractWrapper.instances.set(
        key,
        new DatabaseContractWrapper(
          databaseName,
          merkleHeight,
          deployerAddress,
          appAddress
        )
      );
    }
    return DatabaseContractWrapper.instances.get(key)!;
  }

  async compile() {
    if (!this.isCompiled) {
      await this.zkDatabaseSmartContact.compileProof();
      this.isCompiled = true;
    }
  }

  async deploy(appKey: PrivateKey) {
    await this.compile();

    const zkApp = new this.zkDatabaseSmartContact(this.appAddress);
    let tx = await zkApp.createAndProveDeployTransaction();
    tx = await getSigner().signTransaction(tx, [appKey]);
    const pendingTx = await tx.send();
    await pendingTx.wait();
  }

  async rollUp(jsonProof: JsonProof) {
    await this.compile();

    const zkApp = new this.zkDatabaseSmartContact(this.appAddress);
    let tx = await zkApp.createAndProveRollUpTransaction(jsonProof);
    tx = await getSigner().signTransaction(tx, []);
    await tx.send();
  }
}
