import {
  AccountUpdate,
  Bool,
  Field,
  JsonProof,
  Mina,
  PublicKey,
  SmartContract,
  VerificationKey,
  ZkProgram,
} from 'o1js';
import { DatabaseRollUp, RollUpProgram } from '../proof/proof-program.js';
import { MinaTransaction } from '../types/transaction.js';
import {
  getZkDbSmartContractClass,
  ZKDatabaseSmartContractClass,
} from './zkdb-app.js';
import { CacheManager } from '../cache/cache-manager.js';

export class ZKDatabaseSmartContractWrapper {
  private _smartContract: ZKDatabaseSmartContractClass;
  private rollUpProgram: DatabaseRollUp;
  private merkleHeight: number;
  private verificationKey: VerificationKey;
  private publicKey: PublicKey;

  constructor(merkleHeight: number, publicKey: PublicKey) {
    this.rollUpProgram = RollUpProgram(merkleHeight);
    this._smartContract = getZkDbSmartContractClass(
      merkleHeight,
      this.rollUpProgram
    );
    this.publicKey = publicKey;
    this.merkleHeight = merkleHeight;
  }

  async compile() {
    if (!this.verificationKey) {
      try {
        const [rollUpCache, smartContractCache] = await Promise.all([
          CacheManager.provideCache('rollup-zkprogram', this.merkleHeight),
          CacheManager.provideCache('user-database-zkapp', this.merkleHeight),
        ]);

        await this.rollUpProgram.compile({ cache: rollUpCache });
        this.verificationKey = (
          await this._smartContract.compile({ cache: smartContractCache })
        ).verificationKey;
      } catch (error) {
        console.error('Compilation error:', error);
        throw error;
      }
    }
  }

  async createAndProveDeployTransaction(
    callerPublicKey: PublicKey
  ): Promise<MinaTransaction> {
    const zkApp = new this._smartContract(this.publicKey);

    const tx = await Mina.transaction(
      {
        sender: callerPublicKey,
        fee: 100_000_000,
      },
      async () => {
        AccountUpdate.fundNewAccount(callerPublicKey);
        await zkApp.deploy();
      }
    );

    await tx.prove();
    return tx;
  }

  async createAndProveRollUpTransaction(
    callerPublicKey: PublicKey,
    jsonProof: JsonProof
  ): Promise<MinaTransaction> {
    const zkApp = new this._smartContract(this.publicKey);
    class ZkDbProof extends ZkProgram.Proof(this.rollUpProgram) {}

    const proof = await ZkDbProof.fromJSON(jsonProof);
    const tx = await Mina.transaction(
      {
        sender: callerPublicKey,
        fee: 100_000_000,
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
