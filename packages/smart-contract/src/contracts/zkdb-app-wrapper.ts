import {
  AccountUpdate,
  JsonProof,
  Mina,
  PublicKey,
  VerificationKey,
  ZkProgram,
} from 'o1js';
import { DatabaseRollUp, RollUpProgram } from '../proof/index';
import { MinaTransaction } from '@types';
import {
  getZkDbSmartContractClass,
  ZKDatabaseSmartContractClass,
} from './zkdb-app';
import { CacheManager } from '../cache/cache-manager';
import { DEFAULT_FEE, TransactionDetails } from './transaction-details';

export class ZKDatabaseSmartContractWrapper {
  private _smartContract: ZKDatabaseSmartContractClass;
  private rollUpProgram: DatabaseRollUp;
  private merkleHeight: number;
  private verificationKey: VerificationKey;

  private constructor(merkleHeight: number, rollUpProgram: DatabaseRollUp) {
    this.rollUpProgram = rollUpProgram;
    this._smartContract = getZkDbSmartContractClass(
      merkleHeight,
      this.rollUpProgram
    );
    this.merkleHeight = merkleHeight;
  }

  public static testConstructor(merkleHeight: number, rollUpProgram: DatabaseRollUp) {
    return new ZKDatabaseSmartContractWrapper(merkleHeight, rollUpProgram)
  }

  public static mainConstructor(merkleHeight: number) {
    return new ZKDatabaseSmartContractWrapper(merkleHeight, RollUpProgram(merkleHeight))
  }

  isCompiled(): boolean {
    return this.verificationKey !== undefined;
  }

  private setVerificationKey(vk: VerificationKey) {
    this.verificationKey = vk;
  }

  async compile() {
    if (!this.isCompiled()) {
      try {
        const [rollUpCache, smartContractCache] = await Promise.all([
          CacheManager.provideCache('rollup-zkprogram', this.merkleHeight),
          CacheManager.provideCache('user-database-zkapp', this.merkleHeight),
        ]);

        await this.rollUpProgram.compile({ cache: rollUpCache });
        const vk = (
          await this._smartContract.compile({ cache: smartContractCache })
        ).verificationKey;

        this.setVerificationKey(vk);
      } catch (error) {
        console.error('Compilation error:', error);
        throw error;
      }
    }
  }

  async createAndProveDeployTransaction(
    transactionDetails: TransactionDetails
  ): Promise<MinaTransaction> {
    const zkApp = new this._smartContract(transactionDetails.zkApp);

    const tx = await Mina.transaction(
      {
        sender: transactionDetails.sender,
        fee: transactionDetails.fee ?? DEFAULT_FEE,
      },
      async () => {
        AccountUpdate.fundNewAccount(transactionDetails.sender);
        await zkApp.deploy();
      }
    );

    await tx.prove();
    return tx;
  }

  async createAndProveRollUpTransaction(
    transactionDetails: TransactionDetails,
    jsonProof: JsonProof
  ): Promise<MinaTransaction> {
    const zkApp = new this._smartContract(transactionDetails.zkApp);
    class ZkDbProof extends ZkProgram.Proof(this.rollUpProgram) {}

    const proof = await ZkDbProof.fromJSON(jsonProof);
    const tx = await Mina.transaction(
      {
        sender: transactionDetails.sender,
        fee: transactionDetails.fee ?? DEFAULT_FEE,
      },
      async () => {
        await zkApp.rollUp(proof);
      }
    );
    await tx.prove();
    return tx;
  }

  public get smartContract() {
    return this._smartContract;
  }
}
