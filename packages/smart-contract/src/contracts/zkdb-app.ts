import {
  AccountUpdate,
  Field,
  JsonProof,
  MerkleTree,
  Mina,
  PrivateKey,
  PublicKey,
  Reducer,
  SmartContract,
  State,
  ZkProgram,
  method,
  state,
} from 'o1js';
import { RollUpProgram } from '../proof/proof-program.js';
import { MinaTransaction } from '../types/transaction.js';

type ZKDatabaseSmartContract = ReturnType<typeof getZkDbSmartContractClass>;

export function getZkDbSmartContract(
  name: string,
  merkleHeight: number
): ZKDatabaseSmartContract {
  const zkDbSmartContract = getZkDbSmartContractClass(name, merkleHeight);
  return zkDbSmartContract;
}

function getZkDbSmartContractClass(
  name: string,
  merkleHeight: number,
  callerPublicKey: PublicKey
) {
  const dummyMerkleTree = new MerkleTree(merkleHeight);
  const rollUpProgram = RollUpProgram(name, merkleHeight);

  class ZkDbProof extends ZkProgram.Proof(rollUpProgram) {}

  class ZkDbSmartContract extends SmartContract {
    @state(Field) state = State<Field>();
    @state(Field) actionState = State<Field>();

    init() {
      super.init();
      this.state.set(dummyMerkleTree.getRoot());
    }

    static async compileProof() {
      await rollUpProgram.compile();
      await ZkDbSmartContract.compile();
    }

    async verify(jsonProof: JsonProof) {
      const proof = await ZkDbProof.fromJSON(jsonProof);
      proof.verify();
    }

    async createAndProveDeployTransaction(): Promise<MinaTransaction> {
      const tx = await Mina.transaction(
        {
          sender: callerPublicKey,
          fee: 100_000_000,
        },
        async () => {
          AccountUpdate.fundNewAccount(callerPublicKey);
          await this.deploy();
        }
      );

      await tx.prove();
      return tx;
    }

    async createAndProveRollUpTransaction(
      jsonProof: JsonProof
    ): Promise<MinaTransaction> {
      const proof = await ZkDbProof.fromJSON(jsonProof);
      const tx = await Mina.transaction(async () => {
        await this.rollUp(proof);
      });
      await tx.prove();
      return tx;
    }

    @method async rollUp(proof: ZkDbProof) {
      this.state.getAndRequireEquals();

      proof.verify();

      this.state.requireEquals(proof.publicInput.rootState);
      this.state.set(proof.publicOutput.rootState);
    }
  }

  return ZkDbSmartContract;
}
