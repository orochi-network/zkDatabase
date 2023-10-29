import {
  AccountUpdate,
  Experimental,
  Field,
  SelfProof,
} from 'o1js';
import { RollUpInput, RollUpOutput } from './rollup-params.js';
import { Action } from './action.js';
import { DatabaseMerkleWitness } from '../core/database-witness.js';

function calculateActionState(oldActionState: Field, action: Action) {
  const actionsHash = AccountUpdate.Actions.hash([Action.toFields(action)]);
  const newActionState = AccountUpdate.Actions.updateSequenceState(oldActionState, actionsHash);
  return newActionState;
}

export const OffchainRollUp = Experimental.ZkProgram({
  publicInput: RollUpInput,
  publicOutput: RollUpOutput,

  methods: {
    init: {
      privateInputs: [Field, Action, DatabaseMerkleWitness],

      method(state: RollUpInput, oldLeaf: Field, action: Action, witness: DatabaseMerkleWitness) {
        witness.calculateRoot(oldLeaf).assertEquals(state.onChainRoot);
        witness.calculateIndex().assertEquals(action.index.toFields()[0]);

        const newActionState = calculateActionState(state.onChainActionState, action);
        const newRoot = witness.calculateRoot(action.hash);
        return new RollUpOutput({
          newActionState: newActionState,
          newRoot: newRoot
        })
      }
    },
    update: {
      privateInputs: [SelfProof, Field, Action, DatabaseMerkleWitness],

      method(state: RollUpInput, proof: SelfProof<RollUpInput, RollUpOutput>, oldLeaf: Field, action: Action, witness: DatabaseMerkleWitness) {
        proof.verify();

        proof.publicInput.onChainActionState.assertEquals(state.onChainActionState);
        proof.publicInput.onChainRoot.assertEquals(state.onChainRoot);

        witness.calculateRoot(oldLeaf).assertEquals(proof.publicOutput.newRoot);
        witness.calculateIndex().assertEquals(action.index.toFields()[0]);
        
        const newActionState = calculateActionState(proof.publicOutput.newActionState, action);
        const newRoot = witness.calculateRoot(action.hash);
        return new RollUpOutput({
          newActionState: newActionState,
          newRoot: newRoot
        })
      }
    }
  }
})

export class RollUpProof extends Experimental.ZkProgram.Proof(OffchainRollUp) {}