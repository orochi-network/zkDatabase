import { DatabaseRollUp } from '@proof';
import {
  Bool,
  Field,
  MerkleTree,
  Provable,
  SmartContract,
  State,
  ZkProgram,
  method,
  state,
} from 'o1js';

export type ZKDatabaseSmartContractClass = ReturnType<
  typeof getZkDbSmartContractClass
>;

export function getZkDbSmartContractClass(
  merkleHeight: number,
  rollUpProgram: DatabaseRollUp
) {
  const dummyMerkleTree = new MerkleTree(merkleHeight);

  class ZkDbProof extends ZkProgram.Proof(rollUpProgram) {}

  class ZkDbSmartContract extends SmartContract {
    @state(Field) currentState = State<Field>();
    @state(Field) prevState = State<Field>();
    @state(Field) actionState = State<Field>();

    init() {
      super.init();
      this.currentState.set(dummyMerkleTree.getRoot());
      this.prevState.set(Field(0));
    }

    @method async rollUp(proof: ZkDbProof) {
      proof.verify();

      const currentState = this.currentState.getAndRequireEquals();
      const prevState = this.prevState.getAndRequireEquals();

      Provable.if(
        proof.publicOutput.isTransition,
        Bool,
        proof.publicInput.currentOnChainState
          .equals(proof.publicOutput.onChainState)
          .not()
          .and(proof.publicInput.currentOnChainState.equals(prevState))
          .and(proof.publicOutput.onChainState.equals(currentState)),
        proof.publicInput.previousOnChainState
          .equals(prevState)
          .and(proof.publicInput.currentOnChainState.equals(currentState))
          .and(
            proof.publicInput.currentOnChainState.equals(
              proof.publicOutput.onChainState
            )
          )
      ).assertTrue();

      this.prevState.set(currentState);
      this.currentState.set(proof.publicOutput.newOffChainState);
    }
  }

  return ZkDbSmartContract;
}
