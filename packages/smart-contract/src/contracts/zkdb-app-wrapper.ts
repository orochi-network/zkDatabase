import {
  AccountUpdate,
  JsonProof,
  Mina,
  PublicKey,
  VerificationKey,
  ZkProgram,
} from 'o1js';
import { DatabaseRollUp, RollUpProgram } from '@proof';
import { MinaTransaction } from '@types';
import {
  getZkDbSmartContractClass,
  ZKDatabaseSmartContractClass,
} from './zkdb-app';
import { CacheManager } from '@cache';

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
      console.log('compiling');
      const start = performance.now();
      try {
        const [rollUpCache, smartContractCache] = await Promise.all([
          CacheManager.provideCache('rollup-zkprogram', this.merkleHeight),
          CacheManager.provideCache('user-database-zkapp', this.merkleHeight),
        ]);

        await this.rollUpProgram.compile({ cache: rollUpCache });
        this.verificationKey = (
          await this._smartContract.compile({ cache: smartContractCache })
        ).verificationKey;

        const end = performance.now();
        console.log(`Execution time: ${end - start} milliseconds`);
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

    console.log('proving');
    const start = performance.now();
    await tx.prove();
    const end = performance.now();
    console.log(`Execution time: ${end - start} milliseconds`);
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
    const start = performance.now();
    await tx.prove();
    const end = performance.now();
    console.log(`Execution time: ${end - start} milliseconds`);

    return tx;
  }

  public get smartContract() {
    return this._smartContract;
  }
}
