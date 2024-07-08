import { ZkProgram, Field, SelfProof, MerkleWitness } from 'o1js';
import { ProofState } from './proof-state';
import { Action, calculateActionState } from '../archive-node/action';

export type DatabaseRollUp = ReturnType<typeof RollUpProgram>;

export function RollUpProgram(name: string, merkleTreeHeight: number) {
  class DatabaseMerkleWitness extends MerkleWitness(merkleTreeHeight) {}

  return ZkProgram({
    name: name,
    publicInput: ProofState,
    publicOutput: ProofState,

    methods: {
      init: {
        privateInputs: [DatabaseMerkleWitness, Field, Action],

        async method(
          state: ProofState,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          action: Action
        ) {
          witness.calculateRoot(oldLeaf).assertEquals(state.rootState);
          witness.calculateIndex().assertEquals(action.index.toFields()[0]);

          const newActionState = calculateActionState(
            state.actionState,
            action
          );
          const newRoot = witness.calculateRoot(action.hash);
          return new ProofState({
            actionState: newActionState,
            rootState: newRoot,
          });
        },
      },

      update: {
        privateInputs: [SelfProof, DatabaseMerkleWitness, Field, Action],

        async method(
          state: ProofState,
          proof: SelfProof<ProofState, ProofState>,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          action: Action
        ) {
          proof.verify();

          proof.publicInput.actionState.assertEquals(state.actionState);
          proof.publicInput.rootState.assertEquals(state.rootState);

          witness
            .calculateRoot(oldLeaf)
            .assertEquals(proof.publicOutput.rootState);
          witness.calculateIndex().assertEquals(action.index.toFields()[0]);

          const newActionState = calculateActionState(
            proof.publicOutput.actionState,
            action
          );
          const newRoot = witness.calculateRoot(action.hash);
          return new ProofState({
            actionState: newActionState,
            rootState: newRoot,
          });
        },
      },
    },
  });
}
