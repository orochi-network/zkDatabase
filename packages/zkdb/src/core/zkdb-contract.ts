import {
  Field,
  Provable,
  Reducer,
  SmartContract,
  State,
  UInt64,
  ZkProgram,
  method,
  state,
} from 'o1js';
import { Schema } from './schema.js';
import { Action, OperationType, getOperationIndexByType } from '../rollup/action.js';
import { DatabaseRollUp } from '../rollup/rollup-program.js';

export function DatabaseSmartContract<T>(
  type: Provable<T>,
  rollup: DatabaseRollUp
) {
  class Document extends Schema({ data: type }) {}

  let initialCommitment = Field(0);

  class RollUpProof extends ZkProgram.Proof(rollup) {}

  class DatabaseContract extends SmartContract {
    @state(Field) rootCommitment = State<Field>();
    @state(Field) currentActionState = State<Field>();

    reducer = Reducer({ actionType: Action });

    @method init() {
      this.account.provedState.assertEquals(this.account.provedState.get());
      this.account.provedState.get().assertFalse();

      super.init();

      this.currentActionState.set(Reducer.initialActionState);
      this.rootCommitment.set(initialCommitment);
    }

    @method insert(index: UInt64, document: Document) {
      this.reducer.dispatch(
        new Action({
          type: getOperationIndexByType(OperationType.INSERT),
          index: index,
          hash: document.hash(),
        })
      );
    }

    @method rollup(proof: RollUpProof) {
      this.rootCommitment.getAndAssertEquals();
      this.currentActionState.getAndAssertEquals();

      proof.verify();

      this.rootCommitment.assertEquals(proof.publicInput.onChainRoot);
      this.currentActionState.assertEquals(
        proof.publicInput.onChainActionState
      );

      this.rootCommitment.set(proof.publicOutput.newRoot);
      this.currentActionState.set(proof.publicOutput.newActionState);
    }

    setMerkleRoot(root: Field) {
      initialCommitment = root;
    }
  }

  return {
    DatabaseContract,
    Document,
  };
}
