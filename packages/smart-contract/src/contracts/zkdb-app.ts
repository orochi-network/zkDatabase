import {
  Field,
  MerkleTree,
  PublicKey,
  Reducer,
  SmartContract,
  State,
  ZkProgram,
  method,
  state,
} from 'o1js';
import { RollUpProgram } from '../proof/proof-program';
import { Action } from '../archive-node/action';

export function getZkDbSmartContract(
  databaseName: string,
  merkleHeight: number
) {
  const dummyMerkleTree = new MerkleTree(merkleHeight);

  const zkdbProgram = RollUpProgram(databaseName, merkleHeight);

  class ZkDbProof extends ZkProgram.Proof(zkdbProgram) {}

  class _ extends SmartContract {
    @state(Field) state = State<Field>();
    @state(Field) actionState = State<Field>();

    reducer = Reducer({ actionType: Action });

    init() {
      this.state.set(dummyMerkleTree.getRoot());
      this.actionState.set(Reducer.initialActionState);
    }

    @method apply(action: Action) {
      this.reducer.dispatch(action);
    }

    @method rollUp(proof: ZkDbProof) {
      this.state.getAndRequireEquals();
      this.actionState.getAndRequireEquals();

      proof.verify();

      this.state.requireEquals(proof.publicInput.rootState);
      this.actionState.requireEquals(proof.publicInput.actionState);

      // If we have no error we can guarantee that action state is trustworthy
      this.reducer.getActions({
        fromActionState: this.actionState.get(),
        endActionState: proof.publicOutput.actionState,
      });

      this.state.set(proof.publicOutput.rootState);
      this.actionState.set(proof.publicOutput.actionState);
    }
  }

  return _
}
